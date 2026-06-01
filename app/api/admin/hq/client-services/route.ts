import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClientService } from "@/lib/pagefoundryHq";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const clientService = await createClientService(body);
    return NextResponse.json({ ok: true, clientService }, { status: 201 });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (err?.message?.startsWith("client_service_")) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    if (err?.code === "P2025") return NextResponse.json({ message: "not found" }, { status: 404 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
