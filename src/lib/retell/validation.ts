import { z } from "zod";
import { PROJECT_TYPES } from "./types";

export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "Europe/Berlin";
export const DEFAULT_APPOINTMENT_MINUTES = 30;

export const projectTypeSchema = z.enum(PROJECT_TYPES);

export const bookAppointmentSchema = z.object({
  name: z.string().trim().min(1),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  reason: z.string().trim().min(1),
  projectType: projectTypeSchema.optional(),
  startDateTime: z.string().trim().min(1),
  endDateTime: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).default(DEFAULT_TIMEZONE),
  callId: z.string().trim().optional(),
  transcript: z.string().optional(),
});

export const saveLeadSchema = z.object({
  name: z.string().trim().min(1).default("Unbekannt"),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  reason: z.string().trim().min(1),
  projectType: projectTypeSchema.optional(),
  callId: z.string().trim().optional(),
  transcript: z.string().optional(),
  summary: z.string().optional(),
  noAppointmentReason: z.string().optional(),
});

export const retellWebhookSchema = z.object({
  event: z.string().min(1),
  call: z.record(z.string(), z.unknown()),
});

export function parseRetellToolBody(body: unknown) {
  if (body && typeof body === "object" && "args" in body) {
    const wrapped = body as { args?: unknown; call?: { call_id?: unknown; transcript?: unknown } };
    if (wrapped.args && typeof wrapped.args === "object") {
      return {
        ...(wrapped.args as Record<string, unknown>),
        callId:
          typeof (wrapped.args as Record<string, unknown>).callId === "string"
            ? (wrapped.args as Record<string, unknown>).callId
            : typeof wrapped.call?.call_id === "string"
              ? wrapped.call.call_id
              : undefined,
        transcript:
          typeof (wrapped.args as Record<string, unknown>).transcript === "string"
            ? (wrapped.args as Record<string, unknown>).transcript
            : typeof wrapped.call?.transcript === "string"
              ? wrapped.call.transcript
              : undefined,
      };
    }
  }

  return body;
}

export function parseDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_datetime");
  }
  return date;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}
