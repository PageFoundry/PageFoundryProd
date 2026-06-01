import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateInvoiceStatus } from "@/lib/pagefoundryHq";

function extractIdFromUrl(url: string) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const idIndex = parts.indexOf("invoices") + 1;
  return idIndex > 0 ? parts[idIndex] : null;
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const id = extractIdFromUrl(req.url);
    if (!id) return NextResponse.json({ message: "missing id" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === "string" ? body.status : "";
    const invoice = await updateInvoiceStatus(id, status);
    return NextResponse.json({ ok: true, invoice });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (err?.message?.startsWith("invoice_")) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    if (err?.code === "P2025") return NextResponse.json({ message: "not found" }, { status: 404 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
