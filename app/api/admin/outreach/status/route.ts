import { existsSync } from "fs";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROJECT_DIR = "/home/ubuntu/outreach-demo";
const LOCK_FILE = join(PROJECT_DIR, "data/run.lock");
const REPORT_DIR = join(PROJECT_DIR, "reports");
const OUTREACH_DB = join(PROJECT_DIR, "data/outreach.db");
const execFileAsync = promisify(execFile);

type DraftCandidate = {
  item_id: string | null;
  company: string;
  website: string | null;
  email: string | null;
  subject: string | null;
  issues: string[];
  website_quality: number | null;
  sales_problem: number | null;
};

type GateReviewItem = {
  item_id?: string;
  lead?: {
    id?: string;
    name?: string;
    website?: string;
    email?: string;
    website_quality?: number;
    sales_problem?: number;
  };
  draft?: {
    to?: string;
    subject?: string;
    outreach_fit?: { sendable_issues?: string[]; score?: number };
  };
  outreach_fit?: { sendable_issues?: string[]; score?: number };
  outreachFit?: { sendable_issues?: string[]; score?: number };
  decision?: string;
  reason?: string;
  source?: string;
  sourcePool?: string;
};

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

async function loadSentContacts() {
  const sql = `
    WITH sent_messages AS (
      SELECT
        m.contact_id,
        m.sent_at,
        m.outreach_trigger,
        m.subject,
        ROW_NUMBER() OVER (PARTITION BY m.contact_id ORDER BY m.sent_at DESC) AS rn,
        COUNT(*) OVER (PARTITION BY m.contact_id) AS message_count
      FROM outreach_messages m
      WHERE m.direction = 'out'
        AND m.sent_at IS NOT NULL
        AND COALESCE(m.smtp_response, '') <> 'DRY_RUN'
        AND COALESCE(m.subject, '') NOT LIKE 'SMTP Live Test%'
    )
    SELECT
      s.contact_id,
      s.sent_at,
      s.outreach_trigger AS trigger,
      s.subject,
      s.message_count,
      l.name AS company,
      l.website,
      l.email AS lead_email,
      c.normalized_email AS contacted_email,
      c.normalized_domain AS domain,
      c.status AS contact_status,
      c.bounced,
      c.first_contact_at,
      c.last_reply_at,
      c.reply_tag,
      c.reply_tag_reason
    FROM sent_messages s
    JOIN outreach_contacts c ON c.id = s.contact_id
    JOIN leads l ON l.id = c.lead_id
    WHERE s.rn = 1
    ORDER BY s.sent_at DESC
    LIMIT 200
  `;

  const { stdout } = await execFileAsync("sqlite3", ["-json", OUTREACH_DB, sql], {
    maxBuffer: 1024 * 1024,
  });
  return JSON.parse(stdout || "[]");
}

function issuesFromGateItem(item: GateReviewItem) {
  return (
    item?.outreach_fit?.sendable_issues ||
    item?.draft?.outreach_fit?.sendable_issues ||
    item?.outreachFit?.sendable_issues ||
    []
  );
}

function loadDraftCandidates(drafts: { drafts?: unknown[]; gate_input?: unknown[] } | null): DraftCandidate[] {
  const allDrafts: unknown[] = Array.isArray(drafts?.drafts) ? drafts.drafts : [];
  const hasExplicitGateInput = Array.isArray(drafts?.gate_input);
  const explicitGateInput: unknown[] = hasExplicitGateInput && Array.isArray(drafts?.gate_input) ? drafts.gate_input : [];
  const selectedDrafts = allDrafts.filter((d: unknown) => d && typeof d === "object" && (d as { selected_for_gate?: boolean }).selected_for_gate === true);
  const source: unknown[] = hasExplicitGateInput ? explicitGateInput : selectedDrafts.length ? selectedDrafts : allDrafts;
  return source
    .filter((d: unknown) => d && typeof d === "object" && !(d as { skipped?: boolean }).skipped)
    .slice(0, 30)
    .map((d: unknown) => {
      const item = d as { lead?: { id?: string; name?: string; website?: string; email?: string; website_quality?: number; sales_problem?: number }; draft?: { subject?: string }; outreach_fit?: { sendable_issues?: string[] } };
      return {
        item_id: item.lead?.id || null,
        company: item.lead?.name || "-",
        website: item.lead?.website || null,
        email: item.lead?.email || null,
        subject: item.draft?.subject || null,
        issues: item.outreach_fit?.sendable_issues || [],
        website_quality: item.lead?.website_quality ?? null,
        sales_problem: item.lead?.sales_problem ?? null,
      };
    });
}

function loadReviewItems(gate: { results?: GateReviewItem[] } | null) {
  const results = Array.isArray(gate?.results) ? gate.results : [];
  const approved = results.filter((item) => item?.decision === "send");
  return approved.slice(0, 20).map((item) => ({
    item_id: item.item_id || item.lead?.id || null,
    company: item.lead?.name || "-",
    website: item.lead?.website || null,
    email: item.draft?.to || item.lead?.email || null,
    subject: item.draft?.subject || null,
    reason: item.reason || null,
    source: item.source || item.sourcePool || null,
    issues: issuesFromGateItem(item),
    score: item.outreach_fit?.score ?? item.draft?.outreach_fit?.score ?? null,
    website_quality: item.lead?.website_quality ?? null,
    sales_problem: item.lead?.sales_problem ?? null,
  }));
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

  const draftsPath = join(REPORT_DIR, `${runId}.drafts.json`);
  const [validation, gate, send, drafts, sentContacts] = await Promise.all([
    readJson(validationPath),
    readJson(gatePath),
    readJson(sendPath),
    readJson(draftsPath),
    loadSentContacts().catch(() => []),
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
            gate_skipped: gate.gate_skipped === true,
            candidates_pending: gate.candidates_pending || 0,
            total: gate.total || 0,
            approved: gate.approved || 0,
            manual_review: gate.manual_review || 0,
            architecture: gate.gate_architecture || null,
            models: gate.gate_models || null,
            usage: gate.usage_summary || null,
            top_reasons: Array.isArray(gate.results)
              ? (Object.entries(
                  gate.results.reduce((acc: Record<string, number>, r: { reason?: string; decision?: string }) => {
                    if (r?.decision !== "send") {
                      const k = r?.reason?.split("(")[0] || "unknown";
                      acc[k] = (acc[k] || 0) + 1;
                    }
                    return acc;
                  }, {}),
                ) as [string, number][])
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([reason, count]) => ({ reason, count }))
              : [],
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
    sent_contacts: {
      total: sentContacts.length,
      bounced: sentContacts.filter((contact: { bounced?: number }) => Number(contact.bounced || 0) === 1).length,
      items: sentContacts,
    },
    draft_candidates: {
      total: gate?.gate_skipped === true ? (gate.candidates_pending || 0) : 0,
      items: gate?.gate_skipped === true ? loadDraftCandidates(drafts) : [],
    },
    review_items: {
      total: Array.isArray(gate?.results)
        ? gate.results.filter((item: GateReviewItem) => item?.decision === "send").length
        : 0,
      items: loadReviewItems(gate),
    },
    log_tail: logTail,
  });
}
