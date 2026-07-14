import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendMail } from "@/lib/email";
import { TIMEZONE } from "@/lib/consultation/policy";
import { bookSlot, SlotUnavailableError } from "@/lib/consultation/booking";
import { productOrderKeys, type ProductKey } from "@/lib/products";
import deMessages from "@/i18n/locales/de.json";

const CONSULTATION_ADMIN_EMAIL =
  process.env.CONSULTATION_ADMIN_EMAIL || "admin@pagefoundry.de";
const ZOOM_URL =
  process.env.NEXT_PUBLIC_ZOOM_URL || "https://zoom.us/j/0000000000";

const CONSULTATION_TYPES = [
  "LANDING_PAGE",
  "SEO_AUDIT",
  "CONTENT_COPY",
  "ECOMMERCE_OPTIMIZATION",
  "FULL_SITE_REVIEW",
  "CONVERSION_OPT",
  "SYSTEMS_AUTOMATION",
  "SPEED_AUDIT",
] as const;

// Untrusted Input: alles wird validiert, bevor es Prisma oder eine Mail erreicht.
// Telefon und Notiz sind bewusst optional — Pflicht sind nur Name, E-Mail und Slot.
const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().default(""),
  slotId: z.string().trim().min(1).max(100),
  note: z.string().trim().max(4000).optional().default(""),
  participants: z.coerce.number().int().min(1).max(10).optional().default(1),
  consultationType: z.enum(CONSULTATION_TYPES),
  packageKey: z.string().trim().max(100).optional(),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function packageTitleDe(key: ProductKey): string {
  const products = (deMessages as Record<string, any>).products;
  return products?.[key]?.title ?? key;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Missing or invalid fields" },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Unbekannte Paket-Keys werden ignoriert statt abgelehnt — das Feld ist nur Kontext.
    const packageKey = productOrderKeys.includes(body.packageKey as ProductKey)
      ? (body.packageKey as ProductKey)
      : undefined;
    const packageLine = packageKey
      ? `Angefragtes Paket: ${packageTitleDe(packageKey)}`
      : "";

    const description = [packageLine, body.note].filter(Boolean).join("\n\n");

    const { slot, booking } = await bookSlot({
      slotId: body.slotId,
      email: body.email,
      participants: body.participants,
      consultationType: body.consultationType,
      description,
      zoomUrl: ZOOM_URL,
    });

    const dateFormatter = new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: TIMEZONE,
    });

    const timeFormatter = new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIMEZONE,
    });

    const dateLabel = dateFormatter.format(slot.start);
    const startLabel = timeFormatter.format(slot.start);
    const endLabel = timeFormatter.format(slot.end);

    // Admin-Mail
    const adminSubject = `Neue Consultation · ${body.email} · ${dateLabel} ${startLabel}`;
    const adminText = `
Neue Consultation-Buchung

Name: ${body.name}
E-Mail: ${body.email}
Telefon: ${body.phone || "—"}
${packageLine ? `${packageLine}\n` : ""}
Datum: ${dateLabel}
Zeit: ${startLabel}–${endLabel} (${TIMEZONE})
Teilnehmer: ${booking.participants}
Typ: ${booking.consultationType}

Notiz:
${body.note || "—"}

Zoom-Link:
${ZOOM_URL}
`.trim();

    // Nutzereingaben werden escaped, bevor sie in HTML landen.
    const adminHtml = escapeHtml(adminText).replace(/\n/g, "<br/>");

    await sendMail({
      to: CONSULTATION_ADMIN_EMAIL,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    });

    // Bestätigung an Kunden
    const customerSubject = `Bestätigung deiner Consultation am ${dateLabel}`;
    const customerText = `
Hallo ${body.name},

vielen Dank für deine Buchung einer Beratung bei PageFoundry.
${packageLine ? `\n${packageLine}\n` : ""}
Datum: ${dateLabel}
Zeit: ${startLabel}–${endLabel} (${TIMEZONE})
Teilnehmer: ${booking.participants}
Typ: ${booking.consultationType}
${body.note ? `\nNotiz:\n${body.note}\n` : ""}
Zoom-Link für den Termin:
${ZOOM_URL}

Bis bald,
PageFoundry
`.trim();

    const customerHtml = escapeHtml(customerText).replace(/\n/g, "<br/>");

    await sendMail({
      to: body.email,
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    if (err instanceof SlotUnavailableError) {
      return NextResponse.json(
        { message: "Slot not available anymore" },
        { status: 409 }
      );
    }
    console.error("consultation POST error", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
