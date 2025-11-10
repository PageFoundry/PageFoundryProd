// src/app/api/admin/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const ALLOWED = ["RECEIVED", "IN_PROGRESS", "DONE"] as const;
type Allowed = (typeof ALLOWED)[number];

function extractIdFromUrl(url: string): string | null {
  const { pathname } = new URL(url);
  // .../api/admin/orders/<id>
  const parts = pathname.split("/").filter(Boolean);
  const id = parts[parts.length - 1];
  return id || null;
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const id = extractIdFromUrl(req.url);
    if (!id) return NextResponse.json({ message: "missing id" }, { status: 400 });

    const body = await req.json().catch(() => ({} as any));
    const data: Record<string, any> = {};

    if (body.status !== undefined) {
      const s = String(body.status).toUpperCase();
      if (!ALLOWED.includes(s as Allowed)) {
        return NextResponse.json({ message: "invalid status" }, { status: 400 });
      }
      data.status = s;
    }

    if (body.brief && typeof body.brief === "object") {
      data.brief = body.brief;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: "nothing to update" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { product: true, user: true },
    });

    return NextResponse.json({ ok: true, order });
  } catch (err: any) {
    if (err?.code === "P2025") return NextResponse.json({ message: "not found" }, { status: 404 });
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
