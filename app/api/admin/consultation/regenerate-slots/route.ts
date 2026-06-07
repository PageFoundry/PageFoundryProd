import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Löscht zukünftige, ungebuchte und nicht reservierte Consultation-Slots, damit
// sie beim nächsten Seitenaufruf lazy mit den aktuellen Zeiten/Wochentagen neu
// erzeugt werden. Gebuchte Slots und aktive Temp-Reservierungen bleiben erhalten.
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const { count } = await prisma.consultationSlot.deleteMany({
    where: {
      start: { gte: now },
      isBooked: false,
      OR: [
        { temporaryReservedUntil: null },
        { temporaryReservedUntil: { lt: now } },
      ],
    },
  });

  return NextResponse.json({ deleted: count }, { status: 200 });
}
