import { spawn } from "child_process";
import { existsSync } from "fs";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROJECT_DIR = "/home/ubuntu/outreach-demo";
const LOCK_FILE = join(PROJECT_DIR, "data/run.lock");
const LOG_DIR = join(PROJECT_DIR, "logs");
const REPORT_DIR = join(PROJECT_DIR, "reports");
const OUTREACH_PAUSED = process.env.OUTREACH_PAUSED !== "false";
const MANUAL_OUTREACH_ENABLED = process.env.MANUAL_OUTREACH_ENABLED !== "false";
const RUN_ID_RE = /^\d{4}-\d{2}-\d{2}(?:[.\w-]+)?$/;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function manualRunId(date: string) {
  return `${date}.manual-${new Date().toISOString().slice(11, 19).replaceAll(":", "")}`;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\"'\"'")}'`;
}

async function readJson(path: string) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

async function latestSkippedGateRun(date: string) {
  try {
    const names = await readdir(REPORT_DIR);
    const candidates = await Promise.all(
      names
        .filter((name) => name.startsWith(date) && name.endsWith(".gate.json"))
        .map(async (name) => {
          const runId = name.slice(0, -".gate.json".length);
          const gatePath = join(REPORT_DIR, name);
          const draftsPath = join(REPORT_DIR, `${runId}.drafts.json`);
          const [gate, info] = await Promise.all([
            readJson(gatePath),
            stat(gatePath).catch(() => null),
          ]);
          const skipped = gate?.gate_skipped === true && existsSync(draftsPath);
          return skipped ? { runId, time: info?.mtimeMs || 0 } : null;
        }),
    );
    return candidates
      .filter((item): item is { runId: string; time: number } => Boolean(item))
      .sort((a, b) => b.time - a.time)[0]?.runId || null;
  } catch {
    return null;
  }
}

async function latestApprovedGateRun(date: string) {
  try {
    const names = await readdir(REPORT_DIR);
    const candidates = await Promise.all(
      names
        .filter((name) => name.startsWith(date) && name.endsWith(".gate.json"))
        .map(async (name) => {
          const runId = name.slice(0, -".gate.json".length);
          const gatePath = join(REPORT_DIR, name);
          const sendPath = join(REPORT_DIR, `${runId}.send.json`);
          const [gate, send, info] = await Promise.all([
            readJson(gatePath),
            readJson(sendPath),
            stat(gatePath).catch(() => null),
          ]);
          const alreadyLiveSent = send && send.live === true && Number(send.sent || 0) > 0;
          const eligible =
            gate &&
            gate.gate_skipped !== true &&
            Number(gate.approved || 0) > 0 &&
            !alreadyLiveSent;
          return eligible ? { runId, time: info?.mtimeMs || 0 } : null;
        }),
    );
    return candidates
      .filter((item): item is { runId: string; time: number } => Boolean(item))
      .sort((a, b) => b.time - a.time)[0]?.runId || null;
  } catch {
    return null;
  }
}

function startDetached(
  command: string,
  env: NodeJS.ProcessEnv,
  options: { manageLock?: boolean; lockPayload?: Record<string, unknown>; logFile?: string } = {},
) {
  const manageLock = options.manageLock !== false;
  const output = options.logFile ? `>> ${shellQuote(options.logFile)} 2>&1` : ">/dev/null 2>&1";
  const lockCommand = options.lockPayload
    ? `printf '%s\\n' ${shellQuote(JSON.stringify(options.lockPayload, null, 2))} > ${shellQuote(LOCK_FILE)}`
    : `touch ${shellQuote(LOCK_FILE)}`;
  const wrapped = manageLock
    ? `(${lockCommand}; ${command}; rm -f ${shellQuote(LOCK_FILE)}) ${output} < /dev/null &`
    : `(${command}) ${output} < /dev/null &`;
  const child = spawn("bash", ["-lc", wrapped], {
    cwd: PROJECT_DIR,
    stdio: "ignore",
    env,
  });
  child.unref();
  return child;
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
  const VALID_GATE_MODES = ["codex_dual", "claude_sonnet", "codex_mini"] as const;
  const VALID_MODES = ["send_latest_approved", "run_gate", "validate_only"] as const;
  type GateMode = (typeof VALID_GATE_MODES)[number];
  const gateMode: GateMode = VALID_GATE_MODES.includes(body?.gate_mode) ? body.gate_mode : "codex_dual";
  const forcePlz: string | null = typeof body?.force_plz === "string" && /^\d{5}$/.test(body.force_plz.trim()) ? body.force_plz.trim() : null;

  const date = today();
  const [skippedGateRunId, approvedGateRunId] = await Promise.all([
    latestSkippedGateRun(date),
    latestApprovedGateRun(date),
  ]);

  const requestedMode: string = body?.mode || (
    approvedGateRunId ? "send_latest_approved" :
    skippedGateRunId ? "run_gate" :
    "validate_only"
  );
  if (!VALID_MODES.includes(requestedMode as (typeof VALID_MODES)[number])) {
    return NextResponse.json({ error: "invalid outreach mode" }, { status: 400 });
  }
  const logFile = join(LOG_DIR, `daily-${date}.log`);

  // — Senden: freigegebene Leads direkt aus dem Gate-Report live schicken —
  if (requestedMode === "send_latest_approved") {
    const runId = approvedGateRunId;
    if (!runId || !RUN_ID_RE.test(runId)) {
      return NextResponse.json({ error: "no approved gate run found for today" }, { status: 404 });
    }

    const child = startDetached(
      [
        "node --env-file=.env scripts/send-mails.mjs",
        `--gate reports/${runId}.gate.json`,
        `--output reports/${runId}.send.json`,
        "--limit 10",
        "--trigger manual_button_reviewed",
        "--ignore-daily-limit",
        "--live",
      ].join(" "),
      { ...process.env, OUTREACH_TRIGGER: "manual_button_reviewed" },
      {
        lockPayload: {
          run_id: runId,
          trigger: "manual_button_reviewed",
          phase: "send",
          started_at: new Date().toISOString(),
        },
        logFile,
      },
    );

    return NextResponse.json({ started: true, pid: child.pid, trigger: "manual_button_reviewed", run_id: runId, mode: requestedMode }, { status: 202 });
  }

  // — Gate ausführen: auf vorhandenen Drafts aus einem SKIP_GATE-Lauf —
  if (requestedMode === "run_gate") {
    const runId = skippedGateRunId || await latestSkippedGateRun(date);
    if (!runId || !RUN_ID_RE.test(runId)) {
      return NextResponse.json({ error: "no gate-skipped drafts found for today" }, { status: 404 });
    }
    const skippedGate = await readJson(join(REPORT_DIR, `${runId}.gate.json`));
    const gateLimit = Number(skippedGate?.candidates_pending || 0);

    const child = startDetached(
      [
        "node --env-file=.env scripts/run-llm-gate.mjs",
        `--input reports/${runId}.drafts.json`,
        `--output reports/${runId}.gate.json`,
        gateLimit > 0 ? `--limit ${gateLimit}` : "",
        "--write-reviews",
        "--timeout 600000",
      ].filter(Boolean).join(" "),
      { ...process.env, GATE_ARCHITECTURE: gateMode },
      {
        lockPayload: {
          run_id: runId,
          trigger: "manual_gate",
          phase: "gate",
          gate_architecture: gateMode,
          gate_limit: gateLimit || null,
          started_at: new Date().toISOString(),
        },
        logFile,
      },
    );

    return NextResponse.json({ started: true, pid: child.pid, run_id: runId, mode: requestedMode, gate_architecture: gateMode }, { status: 202 });
  }

  // — Leads suchen: validieren + Drafts bauen, Gate überspringen (validate_only) —
  // Skript managed eigenes Lock — kein Pre-Touch sonst ABORT.
  const validateEnv: NodeJS.ProcessEnv = {
    ...process.env,
    OUTREACH_LIVE: "false",
    OUTREACH_TRIGGER: "manual_button",
    SKIP_GATE: "true",
    OUTREACH_RUN_ID: manualRunId(date),
  };
  if (forcePlz) validateEnv.OUTREACH_PLZ = forcePlz;

  const child = startDetached("./runDailyOutreach.sh", validateEnv, { manageLock: false });

  return NextResponse.json({ started: true, pid: child.pid, trigger: "manual_button", mode: "validate_only", run_id: validateEnv.OUTREACH_RUN_ID, ...(forcePlz ? { forced_plz: forcePlz } : {}) }, { status: 202 });
}
