import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateBusinessClient } from "@/lib/pagefoundryHq";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const client = await updateBusinessClient(id, await req.json());
    return NextResponse.json({ ok: true, client });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (err?.message === "client_name_required") return NextResponse.json({ message: err.message }, { status: 400 });
    if (err?.code === "P2025") return NextResponse.json({ message: "not_found" }, { status: 404 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
