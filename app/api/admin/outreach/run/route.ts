import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROJECT_DIR = "/home/ubuntu/outreach-demo";
const SCRIPT = join(PROJECT_DIR, "runDailyOutreach.sh");
const LOCK_FILE = join(PROJECT_DIR, "data/run.lock");

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (existsSync(LOCK_FILE)) {
    return NextResponse.json({ error: "outreach run already active" }, { status: 409 });
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
