import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSalesOrAdmin } from "@/lib/auth";
import { createLeadSchema, normalizeEmail, normalizeHost } from "@/lib/sales/leads";
import { leadSelect, listLeads } from "@/lib/sales/data";

export const dynamic = "force-dynamic";

// Middleware schuetzt /api nicht: jeder Handler prueft die Rolle selbst.
async function actorOr403() {
  try {
    return await requireSalesOrAdmin();
  } catch {
    return null;
  }
}

export async function GET() {
  const actor = await actorOr403();
  if (!actor) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  return NextResponse.json({ leads: await listLeads(actor) });
}

export async function POST(req: NextRequest) {
  const actor = await actorOr403();
  if (!actor) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const parsed = createLeadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message || "Ungueltige Eingabe" },
      { status: 400 }
    );
  }
  const v = parsed.data;
  try {
    const lead = await prisma.salesLead.create({
      data: {
        ownerId: actor.sub, // Owner immer serverseitig, nie aus dem Request
        companyName: v.companyName,
        contactName: v.contactName ?? null,
        email: v.email ?? null,
        emailNorm: normalizeEmail(v.email),
        phone: v.phone ?? null,
        website: v.website ?? null,
        websiteHost: normalizeHost(v.website),
        notes: v.notes ?? null,
      },
      select: leadSelect,
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    // Unique auf websiteHost/emailNorm: Lead gehoert schon jemandem (Lead-Schutz).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { message: "Dieser Lead (Website oder E-Mail) ist bereits erfasst." },
        { status: 409 }
      );
    }
    console.error("[sales/leads] create failed", err);
    return NextResponse.json({ message: "Serverfehler" }, { status: 500 });
  }
}
