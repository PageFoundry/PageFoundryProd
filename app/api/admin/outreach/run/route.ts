import { spawn } from "child_process";
import { existsSync } from "fs";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROJECT_DIR = "/home/ubuntu/outreach-demo";
const SCRIPT = join(PROJECT_DIR, "runDailyOutreach.sh");
const LOCK_FILE = join(PROJECT_DIR, "data/run.lock");
const REPORT_DIR = join(PROJECT_DIR, "reports");
const OUTREACH_PAUSED = process.env.OUTREACH_PAUSED !== "false";
const MANUAL_OUTREACH_ENABLED = process.env.MANUAL_OUTREACH_ENABLED !== "false";

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function readJson(path: string) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

async function latestApprovedDryRun(date: string) {
  const names = await readdir(REPORT_DIR);
  const candidates = await Promise.all(
    names
      .filter((name) => name.startsWith(date) && name.endsWith(".send.json"))
      .map(async (name) => {
        const runId = name.slice(0, -".send.json".length);
        const sendPath = join(REPORT_DIR, name);
        const gatePath = join(REPORT_DIR, `${runId}.gate.json`);
        const [send, gate, info] = await Promise.all([
          readJson(sendPath),
          readJson(gatePath),
          stat(sendPath).catch(() => null),
        ]);
        const approved =
          send &&
          gate &&
          send.live === false &&
          Number(send.sendable_from_gate || 0) > 0 &&
          Number(send.sent || 0) === 0 &&
          Number(send.errors || 0) === 0 &&
          Number(gate.approved || 0) > 0;
        return approved ? { runId, time: info?.mtimeMs || 0 } : null;
      }),
  );

  return candidates
    .filter((item): item is { runId: string; time: number } => Boolean(item))
    .sort((a, b) => b.time - a.time)[0]?.runId || null;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (OUTREACH_PAUSED && !MANUAL_OUTREACH_ENABLED) {
    return NextResponse.json({ error: "cold outreach is paused" }, { status: 423 });
  }

  if (existsSync(LOCK_FILE)) {
    return NextResponse.json({ error: "outreach run already active" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const mode = body?.mode || "run_new";

  if (mode === "send_latest_approved") {
    const runId = await latestApprovedDryRun(today());
    if (!runId) {
      return NextResponse.json({ error: "no approved dry-run found for today" }, { status: 404 });
    }

    const child = spawn("node", [
      "--env-file=.env",
      "scripts/send-mails.mjs",
      "--gate",
      `reports/${runId}.gate.json`,
      "--output",
      `reports/${runId}.send.json`,
      "--limit",
      "5",
      "--trigger",
      "manual_button_reviewed",
      "--ignore-daily-limit",
      "--live",
    ], {
      cwd: PROJECT_DIR,
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        OUTREACH_TRIGGER: "manual_button_reviewed",
      },
    });

    child.unref();

    return NextResponse.json(
      {
        started: true,
        pid: child.pid,
        trigger: "manual_button_reviewed",
        run_id: runId,
        mode,
      },
      { status: 202 },
    );
  }

  const child = spawn(SCRIPT, {
    cwd: PROJECT_DIR,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      OUTREACH_LIVE: "true",
      OUTREACH_TRIGGER: "manual_button",
    },
  });

  child.unref();

  return NextResponse.json(
    {
      started: true,
      pid: child.pid,
      trigger: "manual_button",
      routine_runs_used: 0,
      claude_mode: "local_cli_batch",
    },
    { status: 202 },
  );
}
