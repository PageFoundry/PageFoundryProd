import type { CallLead, CalendarEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatGermanDateTime } from "./time";

type LeadWithEvents = CallLead & { calendarEvents?: CalendarEvent[] };

type DiscordField = {
  name: string;
  value: string;
  inline?: boolean;
};

function fallback(value: string | null | undefined) {
  return value && value.trim() ? value.trim() : "-";
}

function truncate(value: string, max = 900) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function leadUrl(leadId: string) {
  const baseUrl = process.env.APP_BASE_URL;
  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/admin?lead=${encodeURIComponent(leadId)}` : undefined;
}

export function buildDiscordLeadPayload(lead: LeadWithEvents) {
  const event = lead.calendarEvents?.[0];
  const booked = Boolean(lead.appointmentBooked && event);
  const fields: DiscordField[] = [
    { name: "Name", value: fallback(lead.name), inline: true },
    { name: "Firma", value: fallback(lead.company), inline: true },
    { name: "Telefon", value: fallback(lead.phone), inline: true },
    { name: "Grund", value: truncate(fallback(lead.reason)), inline: false },
    { name: "Projekttyp", value: fallback(lead.projectType), inline: true },
  ];

  if (booked && event) {
    fields.push({
      name: "Termin",
      value: `${formatGermanDateTime(event.startDateTime, event.timezone)} ${event.timezone}`,
      inline: false,
    });
  } else {
    fields.push({
      name: "Kein Termin",
      value: fallback(lead.noAppointmentReason || "Nicht vereinbart"),
      inline: false,
    });
  }

  fields.push({ name: "Retell Call ID", value: fallback(lead.retellCallId), inline: false });

  if (lead.summary) {
    fields.push({ name: "Zusammenfassung", value: truncate(lead.summary), inline: false });
  }

  const url = leadUrl(lead.id);
  if (url) {
    fields.push({ name: "Interner Link", value: url, inline: false });
  }

  return {
    embeds: [
      {
        title: booked ? "📞 Neuer Website-Termin gebucht" : "📞 Neuer Anruf / Lead ohne Termin",
        color: booked ? 5814783 : 15844367,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function sendDiscordLeadNotification(leadId: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const lead = await prisma.callLead.findUnique({
    where: { id: leadId },
    include: { calendarEvents: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!lead || lead.discordNotifiedAt) {
    return { sent: false, skipped: true };
  }

  if (!webhookUrl) {
    return { sent: false, skipped: true };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildDiscordLeadPayload(lead)),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`discord_webhook_failed:${response.status}:${text.slice(0, 200)}`);
  }

  await prisma.callLead.update({
    where: { id: leadId },
    data: { discordNotifiedAt: new Date() },
  });

  return { sent: true, skipped: false };
}
