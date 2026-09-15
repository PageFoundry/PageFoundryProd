import { prisma } from "@/lib/prisma";
import { sendDiscordLeadNotification } from "./discord";
import { extractLeadInputFromRetellCall, shouldNotifyCallLead, upsertCallLead } from "./leads";
import { notifyCrmEvent } from "@/lib/crmBridge";

const ANALYZED_EVENT = "call_analyzed";

export async function handleRetellWebhookEvent(event: string, call: Record<string, unknown>) {
  const leadInput = extractLeadInputFromRetellCall(event, call);
  const lead = await upsertCallLead(leadInput);
  await notifyCrmEvent({
    type: "calllead.upserted",
    data: {
      id: lead.id,
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      reason: lead.reason,
      summary: lead.summary,
      callId: lead.retellCallId,
      callType: lead.callType,
      leadQuality: lead.leadQuality,
      serviceInterest: lead.serviceInterest,
      urgency: lead.urgency,
      budgetMentioned: lead.budgetMentioned,
      followUpRequired: lead.followUpRequired,
      callerSentiment: lead.callerSentiment,
      updatedAt: lead.updatedAt.toISOString(),
    },
  });

  if (event !== ANALYZED_EVENT) {
    return { leadId: lead.id, notified: false };
  }

  const currentLead = await prisma.callLead.findUnique({
    where: { id: lead.id },
    select: { id: true, discordNotifiedAt: true },
  });

  if (currentLead?.discordNotifiedAt) {
    return { leadId: lead.id, notified: false };
  }

  const analyzedLead = await prisma.callLead.findUnique({
    where: { id: lead.id },
    select: { callType: true, followUpRequired: true },
  });

  if (!analyzedLead || !shouldNotifyCallLead(analyzedLead)) {
    return { leadId: lead.id, notified: false, skipped: true };
  }

  try {
    const result = await sendDiscordLeadNotification(lead.id);
    return { leadId: lead.id, notified: result.sent };
  } catch (error) {
    console.error("Retell Discord notification failed", error);
    return { leadId: lead.id, notified: false, notificationError: "discord_failed" };
  }
}
