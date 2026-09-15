import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createOptionDocument } from "@/lib/pagefoundryHq";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const document = await createOptionDocument(body);
    return NextResponse.json({ ok: true, document }, { status: 201 });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (err?.message?.startsWith("option_document_")) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    if (err?.code === "P2025") return NextResponse.json({ message: "not found" }, { status: 404 });
    if (err?.code === "P2002") return NextResponse.json({ message: "option_document_number_exists" }, { status: 409 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
