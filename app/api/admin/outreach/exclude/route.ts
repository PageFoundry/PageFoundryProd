import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROJECT_DIR = "/home/ubuntu/outreach-demo";
const REPORT_DIR = join(PROJECT_DIR, "reports");
const RUN_ID_RE = /^\d{4}-\d{2}-\d{2}(?:[.\w-]+)?$/;

type ReportItem = {
  item_id?: string;
  selected_for_gate?: boolean;
  decision?: string;
  reason?: string;
  removed_at?: string;
  removed_reason?: string;
  lead?: {
    id?: string;
    name?: string;
  };
};

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function itemId(item: ReportItem) {
  return item.item_id || item.lead?.id || null;
}

function recalcGate(gate: Record<string, any>) {
  const results = Array.isArray(gate.results) ? gate.results : [];
  gate.approved = results.filter((item: ReportItem) => item.decision === "send").length;
  gate.manual_review = results.filter((item: ReportItem) => item.decision === "manual_review").length;
  gate.removed = results.filter((item: ReportItem) => item.decision === "manual_removed").length;
  if (gate.gate_skipped === true) {
    gate.candidates_pending = Number(gate.candidates_pending || 0);
  } else {
    gate.total = results.filter((item: ReportItem) => item.decision !== "manual_removed").length;
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const runId = typeof body?.run_id === "string" ? body.run_id.trim() : "";
  const targetId = typeof body?.item_id === "string" ? body.item_id.trim() : "";

  if (!RUN_ID_RE.test(runId)) return NextResponse.json({ error: "invalid_run_id" }, { status: 400 });
  if (!targetId) return NextResponse.json({ error: "missing_item_id" }, { status: 400 });

  const gatePath = join(REPORT_DIR, `${runId}.gate.json`);
  const draftsPath = join(REPORT_DIR, `${runId}.drafts.json`);
  const sendPath = join(REPORT_DIR, `${runId}.send.json`);
  if (!existsSync(gatePath)) return NextResponse.json({ error: "gate_report_not_found" }, { status: 404 });

  const gate = await readJson(gatePath);
  const send = existsSync(sendPath) ? await readJson(sendPath).catch(() => null) : null;
  if (send?.live === true && Number(send.sent || 0) > 0) {
    return NextResponse.json({ error: "run_already_live_sent" }, { status: 409 });
  }

  const now = new Date().toISOString();

  if (gate?.gate_skipped === true) {
    if (!existsSync(draftsPath)) return NextResponse.json({ error: "drafts_report_not_found" }, { status: 404 });
    const drafts = await readJson(draftsPath);
    const gateInput = Array.isArray(drafts.gate_input) ? drafts.gate_input : [];
    const before = gateInput.length;
    drafts.gate_input = gateInput.filter((item: ReportItem) => itemId(item) !== targetId);

    if (before === drafts.gate_input.length) return NextResponse.json({ error: "candidate_not_found" }, { status: 404 });

    if (Array.isArray(drafts.drafts)) {
      drafts.drafts = drafts.drafts.map((item: ReportItem) => {
        if (itemId(item) !== targetId) return item;
        return {
          ...item,
          selected_for_gate: false,
          removed_at: now,
          removed_reason: "manual_removed_from_dry_run",
        };
      });
    }

    drafts.gate_input_count = drafts.gate_input.length;
    drafts.removed_candidates = [
      ...(Array.isArray(drafts.removed_candidates) ? drafts.removed_candidates : []),
      { item_id: targetId, removed_at: now, reason: "manual_removed_from_dry_run" },
    ];
    gate.candidates_pending = drafts.gate_input.length;
    gate.removed = Number(gate.removed || 0) + 1;
    await Promise.all([writeJson(draftsPath, drafts), writeJson(gatePath, gate)]);

    return NextResponse.json({
      ok: true,
      run_id: runId,
      item_id: targetId,
      removed_from: "gate_input",
      candidates_pending: gate.candidates_pending,
    });
  }

  if (!Array.isArray(gate?.results)) return NextResponse.json({ error: "gate_results_missing" }, { status: 404 });

  let removed = false;
  gate.results = gate.results.map((item: ReportItem) => {
    if (itemId(item) !== targetId || item.decision !== "send") return item;
    removed = true;
    return {
      ...item,
      original_decision: item.decision,
      decision: "manual_removed",
      reason: "manual_removed_from_dry_run",
      removed_at: now,
    };
  });
  if (!removed) return NextResponse.json({ error: "approved_candidate_not_found" }, { status: 404 });

  recalcGate(gate);
  await writeJson(gatePath, gate);

  if (send && send.live !== true) {
    send.sendable_from_gate = gate.approved;
    send.skipped_manual_removed = Number(send.skipped_manual_removed || 0) + 1;
    send.reason = gate.approved > 0 ? send.reason : "approved_below_min_send_threshold";
    await writeJson(sendPath, send);
  }

  return NextResponse.json({
    ok: true,
    run_id: runId,
    item_id: targetId,
    removed_from: "approved_gate",
    approved: gate.approved,
  });
}
