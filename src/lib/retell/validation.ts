import { z } from "zod";
import { PROJECT_TYPES } from "./types";

export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "Europe/Berlin";
export const DEFAULT_APPOINTMENT_MINUTES = 30;

export const projectTypeSchema = z.enum(PROJECT_TYPES);

const optionalString = () =>
  z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v == null || v === "" ? undefined : v));

const optionalNonEmptyString = () =>
  z
    .string()
    .trim()
    .min(1)
    .nullish()
    .transform((v) => (v == null || v === "" ? undefined : v));

const optionalProjectType = () =>
  projectTypeSchema.nullish().transform((v) => (v == null ? undefined : v));

export const bookAppointmentSchema = z.object({
  name: z.string().trim().min(1),
  company: optionalString(),
  phone: optionalString(),
  reason: z.string().trim().min(1),
  projectType: optionalProjectType(),
  startDateTime: z.string().trim().min(1),
  endDateTime: optionalNonEmptyString(),
  timezone: z
    .string()
    .trim()
    .min(1)
    .nullish()
    .transform((v) => (v == null || v === "" ? DEFAULT_TIMEZONE : v)),
  callId: optionalString(),
  transcript: optionalString(),
});

export const saveLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v == null || v === "" ? "Unbekannt" : v)),
  company: optionalString(),
  phone: optionalString(),
  reason: z.string().trim().min(1),
  projectType: optionalProjectType(),
  callId: optionalString(),
  transcript: optionalString(),
  summary: optionalString(),
  noAppointmentReason: optionalString(),
});

export const checkAvailabilitySchema = z.object({
  startDateTime: z.string().trim().min(1),
  endDateTime: optionalNonEmptyString(),
  timezone: z
    .string()
    .trim()
    .min(1)
    .nullish()
    .transform((v) => (v == null || v === "" ? DEFAULT_TIMEZONE : v)),
});

export const retellWebhookSchema = z.object({
  event: z.string().min(1),
  call: z.record(z.string(), z.unknown()),
});

export function parseRetellToolBody(body: unknown) {
  if (body && typeof body === "object" && "args" in body) {
    const wrapped = body as {
      args?: unknown;
      call?: Record<string, unknown>;
    };
    if (wrapped.args && typeof wrapped.args === "object") {
      const args = wrapped.args as Record<string, unknown>;
      const call = wrapped.call || {};
      const direction = typeof call.direction === "string" ? call.direction : "inbound";
      const callerNumber =
        direction === "outbound"
          ? typeof call.to_number === "string"
            ? call.to_number
            : undefined
          : typeof call.from_number === "string"
            ? call.from_number
            : undefined;
      const dynamicVariables =
        (call.retell_llm_dynamic_variables as Record<string, unknown> | undefined) ||
        (call.collected_dynamic_variables as Record<string, unknown> | undefined) ||
        {};
      return {
        ...args,
        callId:
          typeof args.callId === "string"
            ? args.callId
            : typeof call.call_id === "string"
              ? call.call_id
              : undefined,
        transcript:
          typeof args.transcript === "string"
            ? args.transcript
            : typeof call.transcript === "string"
              ? call.transcript
              : undefined,
        phone:
          typeof args.phone === "string" && args.phone.trim()
            ? args.phone
            : typeof dynamicVariables.caller_number === "string" && dynamicVariables.caller_number.trim()
              ? dynamicVariables.caller_number
              : callerNumber,
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
