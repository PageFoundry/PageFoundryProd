import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";

export async function GET() {
  const me = await getUserFromCookie();
  if (!me) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({
    ok: true,
    role: me.role,
  });
}
