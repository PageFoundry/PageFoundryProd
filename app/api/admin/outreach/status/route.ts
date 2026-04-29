import { existsSync } from "fs";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROJECT_DIR = "/home/ubuntu/outreach-demo";
const LOCK_FILE = join(PROJECT_DIR, "data/run.lock");
const REPORT_DIR = join(PROJECT_DIR, "reports");

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function readText(path: string, maxChars = 12000) {
  try {
    const text = await readFile(path, "utf8");
    return text.length > maxChars ? text.slice(text.length - maxChars) : text;
  } catch {
    return null;
  }
}

async function readJson(path: string) {
  const text = await readText(path, 2_000_000);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function currentRunIdFromLock(date: string, logTail: string | null) {
  if (!existsSync(LOCK_FILE)) return null;

  const lockText = await readText(LOCK_FILE, 4000);
  if (lockText) {
    try {
      const payload = JSON.parse(lockText);
      if (typeof payload.run_id === "string" && payload.run_id) return payload.run_id;
    } catch {
      // Older lock files contained only the PID.
    }
  }

  const matches = [...(logTail || "").matchAll(/run_id=([^,\s)]+)/g)];
  return matches.at(-1)?.[1] || date;
}

async function latestRunId(date: string) {
  try {
    const names = await readdir(REPORT_DIR);
    const candidates = names
      .filter((name) => name.startsWith(date) && name.endsWith(".send.json"))
      .map((name) => name.slice(0, -".send.json".length));

    if (!candidates.includes(date)) candidates.push(date);

    const withTime = await Promise.all(
      candidates.map(async (runId) => {
        const sendPath = join(REPORT_DIR, `${runId}.send.json`);
        try {
          const info = await stat(sendPath);
          return { runId, time: info.mtimeMs };
        } catch {
          return { runId, time: 0 };
        }
      }),
    );

    withTime.sort((a, b) => b.time - a.time);
    return withTime[0]?.runId || date;
  } catch {
    return date;
  }
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const date = today();
  const logPath = join(PROJECT_DIR, `logs/daily-${date}.log`);
  const logTail = await readText(logPath);
  const running = existsSync(LOCK_FILE);
  const runId = (running && await currentRunIdFromLock(date, logTail)) || await latestRunId(date);
  const validationPath = join(REPORT_DIR, `${runId}.json`);
  const gatePath = join(REPORT_DIR, `${runId}.gate.json`);
  const sendPath = join(REPORT_DIR, `${runId}.send.json`);

  const [validation, gate, send] = await Promise.all([
    readJson(validationPath),
    readJson(gatePath),
    readJson(sendPath),
  ]);

  return NextResponse.json({
    running,
    date,
    run_id: runId,
    reports: {
      validation: validation
        ? {
            selected_plz: validation.selected_plz || null,
            count: validation.count || 0,
            summary: validation.summary || null,
          }
        : null,
      gate: gate
        ? {
            total: gate.total || 0,
            approved: gate.approved || 0,
            manual_review: gate.manual_review || 0,
          }
        : null,
      send: send
        ? {
            trigger: send.trigger || null,
            live: Boolean(send.live),
            daily_limit: send.daily_limit || null,
            daily_limit_applies: send.daily_limit_applies !== false,
            sendable_from_gate: send.sendable_from_gate || 0,
            sent: send.sent || 0,
            errors: send.errors || 0,
            skipped_daily_limit: send.skipped_daily_limit || 0,
            skipped_blocked: send.skipped_blocked || 0,
          }
        : null,
    },
    log_tail: logTail,
  });
}
