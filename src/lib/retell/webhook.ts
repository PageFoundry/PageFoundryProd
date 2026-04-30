import { prisma } from "@/lib/prisma";
import { sendDiscordLeadNotification } from "./discord";
import { extractLeadInputFromRetellCall, upsertCallLead } from "./leads";

const FINAL_EVENTS = new Set(["call_ended", "call_analyzed"]);

export async function handleRetellWebhookEvent(event: string, call: Record<string, unknown>) {
  const leadInput = extractLeadInputFromRetellCall(event, call);
  const lead = await upsertCallLead(leadInput);

  if (!FINAL_EVENTS.has(event)) {
    return { leadId: lead.id, notified: false };
  }

  const currentLead = await prisma.callLead.findUnique({
    where: { id: lead.id },
    select: { id: true, discordNotifiedAt: true },
  });

  if (currentLead?.discordNotifiedAt) {
    return { leadId: lead.id, notified: false };
  }

  try {
    const result = await sendDiscordLeadNotification(lead.id);
    return { leadId: lead.id, notified: result.sent };
  } catch (error) {
    console.error("Retell Discord notification failed", error);
    return { leadId: lead.id, notified: false, notificationError: "discord_failed" };
  }
}
