import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendInvoiceEmail } from "@/lib/pagefoundryHq";

function extractIdFromUrl(url: string) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const idIndex = parts.indexOf("invoices") + 1;
  return idIndex > 0 ? parts[idIndex] : null;
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const id = extractIdFromUrl(req.url);
    if (!id) return NextResponse.json({ message: "missing id" }, { status: 400 });
    const invoice = await sendInvoiceEmail(id);
    return NextResponse.json({ ok: true, invoice });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (err?.message === "invoice_recipient_missing") {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    if (err?.code === "P2025") return NextResponse.json({ message: "not found" }, { status: 404 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
