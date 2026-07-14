import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { consumePasswordResetToken } from "@/lib/passwordReset";

const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const parsed = resetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid or expired reset link." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const consumed = await consumePasswordResetToken(parsed.data.token, passwordHash);
  if (!consumed) {
    return NextResponse.json({ message: "Invalid or expired reset link." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const expired = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 0 };
  response.cookies.set("pf_session", "", expired);
  response.cookies.set("pf_auth", "", expired);
  response.cookies.set("session", "", expired);
  return response;
}
