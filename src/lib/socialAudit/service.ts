import { runWebsiteAudit } from "./audit";
import { createSocialAudit, getSocialAudit, listSocialAudits, setSocialAuditStatus, updateSocialAudit } from "./db";
import { discoverSocialAuditInput } from "./discovery";
import { sendHighValueLeadNotification } from "./discord";
import { calculateOpportunityScore } from "./scoring";
import type { SocialAuditInput, SocialAuditStatus } from "./types";

export function getSocialAuditSnapshot() {
  const audits = listSocialAudits();
  const hot = audits.filter((audit) => (audit.opportunityScore ?? 0) > 85).length;
  const avgOpportunity =
    audits.length > 0
      ? Math.round(audits.reduce((sum, audit) => sum + (audit.opportunityScore ?? 0), 0) / audits.length)
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    audits,
    summary: {
      total: audits.length,
      hot,
      new: audits.filter((audit) => audit.status === "new").length,
      avgOpportunity,
    },
  };
}

export async function createAndRunSocialAudit(input: SocialAuditInput) {
  const discovery = await discoverSocialAuditInput(input);
  const audit = createSocialAudit({
    companyName: discovery.companyName,
    website: discovery.website,
    instagramUrl: discovery.instagramUrl,
    facebookUrl: discovery.facebookUrl,
    tiktokUrl: discovery.tiktokUrl,
    followers: discovery.followers,
    posts: discovery.posts,
    avgLikes: discovery.avgLikes,
    issues: discovery.issues,
    status: discovery.website ? "new" : "ignored",
  });

  if (!discovery.website) {
    const opportunityScore = calculateOpportunityScore({
      socialScore: audit.socialScore,
      websiteScore: null,
      mobileMenuWorking: true,
      impressumClickable: true,
      privacyClickable: true,
      contactFormFound: true,
    });
    return updateSocialAudit(audit.id, { opportunityScore })!;
  }

  try {
    const websiteAudit = await runWebsiteAudit(audit);
    const updated = updateSocialAudit(audit.id, {
      ...websiteAudit,
      issues: [...discovery.issues.filter((issue) => issue !== "No website found"), ...websiteAudit.issues],
    })!;
    await sendHighValueLeadNotification(updated);
    return updated;
  } catch (err: any) {
    return updateSocialAudit(audit.id, {
      issues: [...discovery.issues, `Website audit failed: ${err?.message || "unknown"}`],
    })!;
  }
}

export function updateSocialAuditStatus(id: number, status: SocialAuditStatus) {
  return setSocialAuditStatus(id, status);
}

export function findSocialAudit(id: number) {
  return getSocialAudit(id);
}
