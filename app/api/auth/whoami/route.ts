export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cookie =
    req.cookies.get("pf_session")?.value ||
    req.cookies.get("session")?.value;

  const headers = { "Cache-Control": "no-store, max-age=0" };

  if (!cookie) {
    return NextResponse.json({ user: null }, { status: 200, headers });
  }

  try {
    const payload = jwt.verify(cookie, process.env.JWT_SECRET!) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    return NextResponse.json({ user }, { headers });
  } catch {
    return NextResponse.json({ user: null }, { status: 200, headers });
  }
}
