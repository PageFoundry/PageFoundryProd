import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createBusinessClient } from "@/lib/pagefoundryHq";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const client = await createBusinessClient(body);
    return NextResponse.json({ ok: true, client }, { status: 201 });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (err?.message?.startsWith("client_")) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
