import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const me = await getUserFromCookie();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: me.sub },
    select: {
      passwordHash: true,
      provider: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Wenn bereits ein Passwort existiert, muss currentPassword stimmen
  if (user.passwordHash) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password required." },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password incorrect." },
        { status: 400 }
      );
    }
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: me.sub },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ ok: true });
}
