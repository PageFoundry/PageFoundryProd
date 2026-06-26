import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { findSocialAudit } from "@/lib/socialAudit/service";
import { generateSocialAuditPdf } from "@/lib/socialAudit/pdf";

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
    const pdf = await generateSocialAuditPdf(audit);
    const filename = `pf-social-audit-${id}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("social audit pdf error", err);
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
