import type { SocialAudit } from "./types";

export async function sendHighValueLeadNotification(audit: SocialAudit) {
  if ((audit.opportunityScore ?? 0) <= 85) return;

  const webhookUrl = process.env.SOCIAL_AUDIT_DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const content = [
    "🔥 HIGH VALUE LEAD",
    "",
    "Company",
    audit.companyName || "Unbekannt",
    "",
    "Followers",
    String(audit.followers ?? 0),
    "",
    "Website Score",
    String(audit.websiteScore ?? 0),
    "",
    "Opportunity",
    String(audit.opportunityScore ?? 0),
    "",
    "Suggested Action",
    `${audit.recommendation.label} ${audit.recommendation.suggestedTime}`,
  ].join("\n");

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch {
    // Discord must never block storing a lead.
  }
}
