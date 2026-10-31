import { prisma } from "@/lib/prisma";
import type { JwtPayload } from "@/lib/auth";

// Datenzugriff fuer /sales und /api/sales/*. Sichtbarkeit: SALES nur eigene Leads,
// ADMIN alle. Keine Abfrage mit referralCode/referredById = null (wuerde fremde
// bzw. unzugeordnete Buchungen liefern).

export const leadSelect = {
  id: true,
  companyName: true,
  contactName: true,
  email: true,
  phone: true,
  website: true,
  notes: true,
  status: true,
  oneTimeValueCents: true,
  monthlyValueCents: true,
  commissionPercentAtWin: true,
  wonAt: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, email: true, name: true } },
} as const;

export async function listLeads(actor: JwtPayload) {
  return prisma.salesLead.findMany({
    where: actor.role === "ADMIN" ? {} : { ownerId: actor.sub },
    orderBy: { updatedAt: "desc" },
    select: leadSelect,
  });
}

export async function getSalesProfile(actor: JwtPayload) {
  return prisma.user.findUnique({
    where: { id: actor.sub },
    select: { id: true, email: true, name: true, role: true, referralCode: true, commissionPercent: true },
  });
}

/** Buchungen, die ueber den eigenen Empfehlungslink kamen. ADMIN: alle zugeordneten. */
export async function listReferredBookings(actor: JwtPayload) {
  return prisma.consultationBooking.findMany({
    where: actor.role === "ADMIN" ? { referredById: { not: null } } : { referredById: actor.sub },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      createdAt: true,
      consultationType: true,
      slot: { select: { start: true } },
      referredBy: { select: { email: true } },
    },
  });
}
