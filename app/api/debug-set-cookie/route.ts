import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJWT } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  // Nimm den zuletzt angelegten User, sonst erstelle einen Test-User
  let user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: `dev+${Date.now()}@example.com`, passwordHash: "", role: "USER" as any },
    });
  }

  const jwt = signJWT({ sub: user.id, role: user.role as any });

  const res = NextResponse.redirect("https://pagefoundry.de/"); // 307/302 egal
  res.cookies.set("pf_session", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".pagefoundry.de",
    path: "/",
    maxAge: 60 * 60, // 1h
  });
  return res;
}
