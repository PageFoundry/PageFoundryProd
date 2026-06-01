import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPagefoundryHqSnapshot } from "@/lib/pagefoundryHq";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getPagefoundryHqSnapshot());
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
