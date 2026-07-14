import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";
import type { ConsultationType } from "@prisma/client";
import { TIMEZONE } from "@/lib/consultation/policy";
import { bookSlot, SlotUnavailableError } from "@/lib/consultation/booking";

const CONSULTATION_ADMIN_EMAIL =
  process.env.CONSULTATION_ADMIN_EMAIL || "admin@pagefoundry.de";
const ZOOM_URL =
  process.env.NEXT_PUBLIC_ZOOM_URL || "https://zoom.us/j/0000000000";

type Body = {
  name: string;
  email: string;
  phone: string;
  slotId: string;
  note: string;
  participants: number;
  consultationType: ConsultationType;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Body>;

    if (
      !body.name ||
      !body.email ||
      !body.phone ||
      !body.slotId ||
      !body.note ||
      !body.participants ||
      !body.consultationType
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const participants = Math.min(
      10,
      Math.max(1, Number(body.participants || 1))
    );

    const { slot, booking } = await bookSlot({
      slotId: body.slotId,
      email: body.email,
      participants,
      consultationType: body.consultationType as ConsultationType,
      description: body.note,
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
Telefon: ${body.phone}

Datum: ${dateLabel}
Zeit: ${startLabel}–${endLabel} (${TIMEZONE})
Teilnehmer: ${booking.participants}
Typ: ${booking.consultationType}

Notiz:
${body.note}

Zoom-Link:
${ZOOM_URL}
`.trim();

    const adminHtml = adminText.replace(/\n/g, "<br/>");

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

Datum: ${dateLabel}
Zeit: ${startLabel}–${endLabel} (${TIMEZONE})
Teilnehmer: ${booking.participants}
Typ: ${booking.consultationType}

Notiz:
${body.note}

Zoom-Link für den Termin:
${ZOOM_URL}

Bis bald,
PageFoundry
`.trim();

    const customerHtml = customerText.replace(/\n/g, "<br/>");

    await sendMail({
      to: body.email!,
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("consultation POST error", err);
    if (err instanceof SlotUnavailableError) {
      return NextResponse.json(
        { message: "Slot not available anymore" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
