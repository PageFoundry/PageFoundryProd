import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ message: "Email and password required" }, { status: 400 });
    if (String(password).length < 8) return NextResponse.json({ message: "Password too weak" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ message: "Account already exists" }, { status: 409 });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash: hash, role: "USER" } });

    const token = signJWT({ sub: user.id, role: user.role });
    const res = NextResponse.json({ id: user.id, role: user.role });
    res.cookies.set("pf_auth", token, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60*60*24*7, domain: "pagefoundry.de",
    });
    return res;
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
