export const PROJECT_TYPES = ["website", "redesign", "seo", "hosting", "web_app", "other"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export type CalendarBookingRequest = {
  name: string;
  company?: string;
  phone?: string;
  reason: string;
  projectType?: ProjectType;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  callId?: string;
  transcript?: string;
};

export type CalendarBookingResult = {
  success: boolean;
  eventId?: string;
  leadId?: string;
  error?: string;
};

export interface CalendarProvider {
  createBooking(input: CalendarBookingRequest): Promise<CalendarBookingResult>;
}

export type LeadInput = {
  name: string;
  company?: string;
  phone?: string;
  reason: string;
  projectType?: ProjectType;
  appointmentRequested?: boolean;
  appointmentBooked?: boolean;
  appointmentDateTime?: Date | null;
  transcript?: string;
  callStatus?: string;
  callId?: string;
  summary?: string;
  noAppointmentReason?: string;
};

export type SlotAlternative = {
  startDateTime: string;
  endDateTime: string;
};
