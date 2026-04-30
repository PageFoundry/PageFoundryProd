import type { RetellProjectType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LeadInput, ProjectType } from "./types";

const PROJECT_TYPE_ALIASES: Record<string, ProjectType> = {
  website: "website",
  landing_page: "website",
  landingpage: "website",
  landing: "website",
  redesign: "redesign",
  seo: "seo",
  hosting: "hosting",
  web_app: "web_app",
  webapp: "web_app",
  app: "web_app",
  other: "other",
  sonstiges: "other",
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "yes", "ja", "1"].includes(value.toLowerCase());
  return undefined;
}

export function normalizeProjectType(value: unknown): ProjectType | undefined {
  const raw = optionalString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return raw ? PROJECT_TYPE_ALIASES[raw] : undefined;
}

export async function upsertCallLead(input: LeadInput) {
  const data = {
    name: input.name || "Unbekannt",
    company: input.company || null,
    phone: input.phone || null,
    reason: input.reason || "Anruf über RetellAI",
    projectType: (input.projectType || null) as RetellProjectType | null,
    appointmentRequested: input.appointmentRequested ?? false,
    appointmentBooked: input.appointmentBooked ?? false,
    appointmentDateTime: input.appointmentDateTime ?? null,
    transcript: input.transcript || null,
    callStatus: input.callStatus || "lead_saved",
    summary: input.summary || null,
    noAppointmentReason: input.noAppointmentReason || null,
  };

  if (input.callId) {
    return prisma.callLead.upsert({
      where: { retellCallId: input.callId },
      create: { ...data, retellCallId: input.callId },
      update: data,
    });
  }

  return prisma.callLead.create({ data });
}

function pickCustom(call: Record<string, unknown>) {
  const analysis = call.call_analysis as Record<string, unknown> | undefined;
  const customAnalysis = analysis?.custom_analysis_data as Record<string, unknown> | undefined;
  const dynamic = call.collected_dynamic_variables as Record<string, unknown> | undefined;

  return { ...(dynamic || {}), ...(customAnalysis || {}) };
}

export function extractLeadInputFromRetellCall(event: string, call: Record<string, unknown>): LeadInput {
  const custom = pickCustom(call);
  const analysis = call.call_analysis as Record<string, unknown> | undefined;
  const callId = optionalString(call.call_id);
  const direction = optionalString(call.direction);
  const phone =
    optionalString(custom.phone) ||
    optionalString(custom.phone_number) ||
    (direction === "outbound" ? optionalString(call.to_number) : optionalString(call.from_number));
  const appointmentDateTime =
    optionalString(custom.appointmentDateTime) ||
    optionalString(custom.appointment_date_time) ||
    optionalString(custom.appointment_start);
  const parsedAppointment = appointmentDateTime ? new Date(appointmentDateTime) : null;

  return {
    callId,
    name:
      optionalString(custom.name) ||
      optionalString(custom.customer_name) ||
      optionalString(custom.caller_name) ||
      "Unbekannt",
    company: optionalString(custom.company) || optionalString(custom.company_name),
    phone,
    reason:
      optionalString(custom.reason) ||
      optionalString(custom.call_reason) ||
      optionalString(analysis?.call_summary) ||
      optionalString(analysis?.summary) ||
      "Anruf über RetellAI",
    projectType: normalizeProjectType(custom.projectType || custom.project_type || custom.project),
    appointmentRequested: optionalBoolean(custom.appointmentRequested || custom.appointment_requested) ?? false,
    appointmentBooked: optionalBoolean(custom.appointmentBooked || custom.appointment_booked) ?? false,
    appointmentDateTime:
      parsedAppointment && !Number.isNaN(parsedAppointment.getTime()) ? parsedAppointment : null,
    transcript: optionalString(call.transcript),
    callStatus: optionalString(call.call_status) || event,
    summary: optionalString(analysis?.call_summary) || optionalString(analysis?.summary),
    noAppointmentReason:
      optionalString(custom.noAppointmentReason) ||
      optionalString(custom.no_appointment_reason) ||
      optionalString(custom.appointment_decline_reason),
  };
}
