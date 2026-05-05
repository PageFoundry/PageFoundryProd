import { existsSync, mkdirSync, renameSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROJECT_DIR = "/home/ubuntu/outreach-demo";
const REPORT_DIR = join(PROJECT_DIR, "reports");
const LOCK_FILE = join(PROJECT_DIR, "data/run.lock");
const RUN_ID_RE = /^\d{4}-\d{2}-\d{2}(?:[.\w-]+)?$/;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (existsSync(LOCK_FILE)) {
    return NextResponse.json({ error: "outreach run active — cannot reset" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const runId = typeof body?.run_id === "string" ? body.run_id.trim() : "";
  if (!RUN_ID_RE.test(runId)) {
    return NextResponse.json({ error: "valid run_id is required" }, { status: 400 });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const moved: string[] = [];
  const archDir = join(REPORT_DIR, "_archived");
  mkdirSync(archDir, { recursive: true });

  for (const name of [`${runId}.json`, `${runId}.drafts.json`, `${runId}.gate.json`, `${runId}.send.json`]) {
    const src = join(REPORT_DIR, name);
    if (!existsSync(src)) continue;
    const dest = join(REPORT_DIR, `_archived/${stamp}-${name}`);
    try {
      renameSync(src, dest);
      moved.push(name);
    } catch (e) {
      return NextResponse.json({ error: `failed to move ${name}: ${(e as Error).message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, run_id: runId, archived: moved, archive_stamp: stamp });
}
