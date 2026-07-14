import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const me = await getUserFromCookie();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: me.sub },
    select: {
      email: true,
      name: true,
      phone: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const me = await getUserFromCookie();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    name,
    phone,
    currentPassword,
    newPassword,
  }: {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  } = body || {};

  if (
    typeof name === "undefined" &&
    typeof phone === "undefined" &&
    typeof newPassword === "undefined"
  ) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: me.sub },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: any = {};

  if (typeof name === "string") {
    data.name = name.trim() || null;
  }

  if (typeof phone === "string") {
    data.phone = phone.trim() || null;
  }

  if (typeof newPassword === "string" && newPassword.length > 0) {
    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Missing current password" },
        { status: 400 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Password change not available" },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(newPassword, 10);
    data.passwordHash = hash;
    data.sessionVersion = { increment: 1 };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: me.sub },
    data,
  });

  return NextResponse.json({ ok: true });
}
