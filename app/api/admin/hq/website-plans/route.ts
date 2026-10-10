import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createWebsitePlan } from "@/lib/websitePlans";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const plan = await createWebsitePlan(await req.json());
    return NextResponse.json({ ok: true, plan }, { status: 201 });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (typeof err?.message === "string" && err.message.startsWith("website_plan_")) return NextResponse.json({ message: err.message }, { status: 400 });
    if (err?.code === "P2025") return NextResponse.json({ message: "client_not_found" }, { status: 404 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
