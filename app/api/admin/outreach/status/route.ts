import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROJECT_DIR = "/home/ubuntu/outreach-demo";
const LOCK_FILE = join(PROJECT_DIR, "data/run.lock");

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

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const date = today();
  const logPath = join(PROJECT_DIR, `logs/daily-${date}.log`);
  const validationPath = join(PROJECT_DIR, `reports/${date}.json`);
  const gatePath = join(PROJECT_DIR, `reports/${date}.gate.json`);
  const sendPath = join(PROJECT_DIR, `reports/${date}.send.json`);

  const [logTail, validation, gate, send] = await Promise.all([
    readText(logPath),
    readJson(validationPath),
    readJson(gatePath),
    readJson(sendPath),
  ]);

  return NextResponse.json({
    running: existsSync(LOCK_FILE),
    date,
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
