import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { SOCIAL_AUDIT_STATUSES, type SocialAuditStatus } from "@/lib/socialAudit/types";
import { findSocialAudit, updateSocialAuditStatus } from "@/lib/socialAudit/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractIdFromUrl(url: string) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const idIndex = parts.indexOf("social-audit") + 1;
  const raw = idIndex > 0 ? parts[idIndex] : null;
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const id = extractIdFromUrl(req.url);
    if (!id) return NextResponse.json({ message: "missing id" }, { status: 400 });
    const audit = findSocialAudit(id);
    if (!audit) return NextResponse.json({ message: "not found" }, { status: 404 });
    return NextResponse.json({ audit });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const id = extractIdFromUrl(req.url);
    if (!id) return NextResponse.json({ message: "missing id" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === "string" ? body.status : "";
    if (!SOCIAL_AUDIT_STATUSES.includes(status as SocialAuditStatus)) {
      return NextResponse.json({ message: "invalid status" }, { status: 400 });
    }
    const audit = updateSocialAuditStatus(id, status as SocialAuditStatus);
    if (!audit) return NextResponse.json({ message: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true, audit });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
