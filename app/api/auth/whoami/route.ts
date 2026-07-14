export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const headers = { "Cache-Control": "no-store, max-age=0" };
  const payload = await getUserFromCookie();
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200, headers });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true },
  });
  return NextResponse.json({ user }, { headers });
}
