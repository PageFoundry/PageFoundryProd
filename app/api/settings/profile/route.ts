import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";

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
      provider: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user });
}

export async function POST(req: NextRequest) {
  const me = await getUserFromCookie();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, phone, email } = body as {
    name?: string;
    phone?: string;
    email?: string;
  };

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email required" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: me.sub },
      data: {
        email,
        name: name ?? null,
        phone: phone ?? null,
      },
      select: {
        email: true,
        name: true,
        phone: true,
        provider: true,
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }
    console.error("settings/profile error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
