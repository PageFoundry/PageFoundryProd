import { z } from "zod";
import type { SalesLeadStatus } from "@prisma/client";

// Reine Regeln ohne DB-Zugriff, damit sie direkt unit-testbar sind.

export const SALES_LEAD_STATUSES = ["NEW", "CONTACTED", "MEETING", "OFFER", "WON", "LOST"] as const;
/** Status, die ein Verkaeufer selbst setzen darf. WON/LOST entscheidet nur ADMIN. */
export const SALES_SETTABLE_STATUSES = ["NEW", "CONTACTED", "MEETING", "OFFER"] as const;
export const CLOSED_STATUSES = ["WON", "LOST"] as const;

export const STATUS_LABELS_DE: Record<SalesLeadStatus, string> = {
  NEW: "Neu",
  CONTACTED: "Kontaktiert",
  MEETING: "Termin",
  OFFER: "Angebot",
  WON: "Gewonnen",
  LOST: "Verloren",
};

/** Normalisiert eine Website auf den Host ohne "www." – Basis des Lead-Schutzes. */
export function normalizeHost(input: string | null | undefined): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    if (!host.includes(".") || host.length > 255) return null;
    return host;
  } catch {
    return null;
  }
}

export function normalizeEmail(input: string | null | undefined): string | null {
  const raw = (input || "").trim().toLowerCase();
  return raw ? raw : null;
}

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const createLeadSchema = z
  .object({
    companyName: z.string().trim().min(1).max(200),
    contactName: optionalText(200),
    email: z.union([z.literal(""), z.string().trim().email().max(320)]).optional().transform((v) => (v ? v : undefined)),
    phone: optionalText(50),
    website: optionalText(512),
    notes: optionalText(4000),
  })
  .refine((v) => Boolean(v.website || v.email), {
    message: "Website oder E-Mail ist Pflicht (Lead-Schutz)",
    path: ["website"],
  })
  .refine((v) => !v.website || normalizeHost(v.website) !== null, {
    message: "Website ist keine gueltige Domain",
    path: ["website"],
  });

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

const cents = z.coerce.number().int().min(0).max(100_000_000);

export const updateLeadSchema = z.object({
  status: z.enum(SALES_LEAD_STATUSES).optional(),
  contactName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(4000).optional(),
  // ADMIN-only:
  oneTimeValueCents: cents.nullable().optional(),
  monthlyValueCents: cents.nullable().optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export type Actor = { sub: string; role: "ADMIN" | "SALES" | "USER" };
export type LeadForUpdate = {
  ownerId: string;
  status: SalesLeadStatus;
  commissionPercentAtWin: number | null;
};

export class LeadPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadPermissionError";
  }
}

/**
 * Baut das Prisma-Update fuer einen Lead und erzwingt die Rechte:
 * - SALES nur eigene Leads, nur NEW..OFFER, keine Betraege, abgeschlossene Leads gesperrt.
 * - ADMIN alles; beim Wechsel auf WON wird der Provisionssatz des Owners eingefroren.
 */
export function buildLeadUpdate(
  actor: Actor,
  lead: LeadForUpdate,
  input: UpdateLeadInput,
  ownerCommissionPercent: number | null,
  now: Date = new Date()
): Record<string, unknown> {
  const isAdmin = actor.role === "ADMIN";
  if (!isAdmin) {
    if (actor.role !== "SALES" || lead.ownerId !== actor.sub) throw new LeadPermissionError("NOT_FOUND");
    if ((CLOSED_STATUSES as readonly string[]).includes(lead.status)) throw new LeadPermissionError("LEAD_CLOSED");
    if (input.status && !(SALES_SETTABLE_STATUSES as readonly string[]).includes(input.status)) {
      throw new LeadPermissionError("STATUS_ADMIN_ONLY");
    }
    if (input.oneTimeValueCents !== undefined || input.monthlyValueCents !== undefined) {
      throw new LeadPermissionError("VALUES_ADMIN_ONLY");
    }
  }

  const data: Record<string, unknown> = {};
  if (input.contactName !== undefined) data.contactName = input.contactName || null;
  if (input.phone !== undefined) data.phone = input.phone || null;
  if (input.notes !== undefined) data.notes = input.notes || null;
  if (isAdmin) {
    if (input.oneTimeValueCents !== undefined) data.oneTimeValueCents = input.oneTimeValueCents;
    if (input.monthlyValueCents !== undefined) data.monthlyValueCents = input.monthlyValueCents;
  }

  if (input.status && input.status !== lead.status) {
    data.status = input.status;
    if (input.status === "WON") {
      data.wonAt = now;
      data.commissionPercentAtWin = ownerCommissionPercent;
    } else if (lead.status === "WON") {
      data.wonAt = null;
      data.commissionPercentAtWin = null;
    }
  }
  return data;
}

export type CommissionLead = {
  status: SalesLeadStatus;
  oneTimeValueCents: number | null;
  monthlyValueCents: number | null;
  commissionPercentAtWin: number | null;
};

/** Monatsprovision laeuft nur ueber die Mindestlaufzeit (Fabian, 2026-10-31). */
export const COMMISSION_MONTHS = 24;

/**
 * Provision je Lead: Anteil am Einmalbetrag und an jeder Monatsrate, Letzteres fuer
 * hoechstens COMMISSION_MONTHS bezahlte Monate. null = nicht gewonnen/nicht vereinbart.
 */
export function commissionFor(lead: CommissionLead): { oneTimeCents: number; monthlyCents: number; monthlyMaxTotalCents: number } | null {
  if (lead.status !== "WON" || lead.commissionPercentAtWin == null) return null;
  const pct = lead.commissionPercentAtWin;
  const monthlyCents = Math.round(((lead.monthlyValueCents ?? 0) * pct) / 100);
  return {
    oneTimeCents: Math.round(((lead.oneTimeValueCents ?? 0) * pct) / 100),
    monthlyCents,
    monthlyMaxTotalCents: monthlyCents * COMMISSION_MONTHS,
  };
}
