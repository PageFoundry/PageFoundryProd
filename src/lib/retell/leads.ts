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

function optionalAnalysisString(value: unknown) {
  return optionalString(value);
}

function firstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

export function normalizeProjectType(value: unknown): ProjectType | undefined {
  const raw = optionalString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return raw ? PROJECT_TYPE_ALIASES[raw] : undefined;
}

export async function upsertCallLead(input: LeadInput) {
  const createData = {
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
    callType: input.callType || null,
    leadQuality: input.leadQuality || null,
    serviceInterest: input.serviceInterest || null,
    urgency: input.urgency || null,
    budgetMentioned: input.budgetMentioned ?? null,
    followUpRequired: input.followUpRequired ?? null,
    callerSentiment: input.callerSentiment || null,
  };

  const updateData = {
    ...(input.name && input.name !== "Unbekannt" ? { name: input.name } : {}),
    ...(input.company ? { company: input.company } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.reason && input.reason !== "Anruf über RetellAI" ? { reason: input.reason } : {}),
    ...(input.projectType ? { projectType: input.projectType as RetellProjectType } : {}),
    ...(input.appointmentRequested !== undefined ? { appointmentRequested: input.appointmentRequested } : {}),
    ...(input.appointmentBooked !== undefined ? { appointmentBooked: input.appointmentBooked } : {}),
    ...(input.appointmentDateTime !== undefined ? { appointmentDateTime: input.appointmentDateTime } : {}),
    ...(input.transcript ? { transcript: input.transcript } : {}),
    ...(input.callStatus ? { callStatus: input.callStatus } : {}),
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.noAppointmentReason ? { noAppointmentReason: input.noAppointmentReason } : {}),
    ...(input.callType ? { callType: input.callType } : {}),
    ...(input.leadQuality ? { leadQuality: input.leadQuality } : {}),
    ...(input.serviceInterest ? { serviceInterest: input.serviceInterest } : {}),
    ...(input.urgency ? { urgency: input.urgency } : {}),
    ...(input.budgetMentioned !== undefined ? { budgetMentioned: input.budgetMentioned } : {}),
    ...(input.followUpRequired !== undefined ? { followUpRequired: input.followUpRequired } : {}),
    ...(input.callerSentiment ? { callerSentiment: input.callerSentiment } : {}),
  };

  if (input.callId) {
    return prisma.callLead.upsert({
      where: { retellCallId: input.callId },
      create: { ...createData, retellCallId: input.callId },
      update: updateData,
    });
  }

  return prisma.callLead.create({ data: createData });
}

function pickCustom(call: Record<string, unknown>) {
  const analysis = call.call_analysis as Record<string, unknown> | undefined;
  const customAnalysis = analysis?.custom_analysis_data as Record<string, unknown> | undefined;
  const dynamic =
    (call.retell_llm_dynamic_variables as Record<string, unknown> | undefined) ||
    (call.collected_dynamic_variables as Record<string, unknown> | undefined);

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
    optionalString(custom.caller_number) ||
    (direction === "outbound" ? optionalString(call.to_number) : optionalString(call.from_number));
  const appointmentDateTime =
    optionalString(custom.appointmentDateTime) ||
    optionalString(custom.appointment_date_time) ||
    optionalString(custom.appointment_start);
  const parsedAppointment = appointmentDateTime ? new Date(appointmentDateTime) : null;
  const customCallType = firstValue(custom, ["callType", "call_type"]);
  const customLeadQuality = firstValue(custom, ["leadQuality", "lead_quality"]);
  const customServiceInterest = firstValue(custom, ["serviceInterest", "service_interest"]);
  const customUrgency = firstValue(custom, ["urgency"]);
  const customBudgetMentioned = firstValue(custom, ["budgetMentioned", "budget_mentioned"]);
  const customFollowUpRequired = firstValue(custom, ["followUpRequired", "follow_up_required"]);
  const customCallerSentiment = firstValue(custom, ["callerSentiment", "caller_sentiment"]);

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
    appointmentRequested: optionalBoolean(firstValue(custom, ["appointmentRequested", "appointment_requested"])),
    appointmentBooked: optionalBoolean(firstValue(custom, ["appointmentBooked", "appointment_booked"])),
    appointmentDateTime:
      parsedAppointment && !Number.isNaN(parsedAppointment.getTime()) ? parsedAppointment : undefined,
    transcript: optionalString(call.transcript),
    callStatus: optionalString(call.call_status) || event,
    summary: optionalString(analysis?.call_summary) || optionalString(analysis?.summary),
    noAppointmentReason:
      optionalString(custom.noAppointmentReason) ||
      optionalString(custom.no_appointment_reason) ||
      optionalString(custom.appointment_decline_reason),
    callType: optionalAnalysisString(customCallType),
    leadQuality: optionalAnalysisString(customLeadQuality),
    serviceInterest: optionalAnalysisString(customServiceInterest),
    urgency: optionalAnalysisString(customUrgency),
    budgetMentioned: optionalBoolean(customBudgetMentioned),
    followUpRequired: optionalBoolean(customFollowUpRequired),
    callerSentiment:
      optionalAnalysisString(customCallerSentiment) || optionalAnalysisString(analysis?.user_sentiment),
  };
}

const NON_RELEVANT_CALL_TYPES = new Set([
  "wrong_number",
  "wrongnumber",
  "falsche_nummer",
  "spam",
  "prank",
  "scherzanruf",
  "irrelevant",
]);

export function shouldNotifyCallLead(lead: {
  callType?: string | null;
  followUpRequired?: boolean | null;
}) {
  if (lead.followUpRequired === false) return false;
  const callType = lead.callType?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return !callType || !NON_RELEVANT_CALL_TYPES.has(callType);
}
