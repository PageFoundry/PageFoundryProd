import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { activateWebsitePlan, billNextWebsiteMonth } from "@/lib/websitePlans";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const result = body.action === "update-details"
      ? await prisma.websitePlan.update({
        where: { id },
        data: Object.fromEntries(["hostingProvider", "hostingRegion", "backupInterval", "backupRetention", "subprocessors", "supportEmail"].map((key) => [key, typeof body[key] === "string" && body[key].trim() ? body[key].trim() : key === "supportEmail" ? "admin@pagefoundry.de" : null])),
      })
      : body.action === "activate"
      ? await activateWebsitePlan(id, body.goLiveDate)
      : body.action === "bill-next"
        ? await billNextWebsiteMonth(id)
        : null;
    if (!result) return NextResponse.json({ message: "website_plan_action_invalid" }, { status: 400 });
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (typeof err?.message === "string" && err.message.startsWith("website_plan_")) return NextResponse.json({ message: err.message }, { status: 400 });
    if (err?.code === "P2025") return NextResponse.json({ message: "not_found" }, { status: 404 });
    if (err?.code === "P2002") return NextResponse.json({ message: "invoice_already_exists" }, { status: 409 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
