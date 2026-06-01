import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceOffering } from "@/lib/pagefoundryHq";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const service = await createServiceOffering(body);
    return NextResponse.json({ ok: true, service }, { status: 201 });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (err?.message?.startsWith("service_")) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    if (err?.code === "P2002") return NextResponse.json({ message: "service_name_exists" }, { status: 409 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
