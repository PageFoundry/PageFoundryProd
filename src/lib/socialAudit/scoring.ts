import type { SocialAudit, SocialAuditRecommendation } from "./types";

const followerCurve = [
  { followers: 0, score: 0 },
  { followers: 500, score: 2.1 },
  { followers: 5000, score: 6.4 },
  { followers: 15000, score: 8.8 },
  { followers: 50000, score: 10 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function interpolateFollowers(followers: number) {
  for (let index = 1; index < followerCurve.length; index += 1) {
    const prev = followerCurve[index - 1];
    const next = followerCurve[index];
    if (followers <= next.followers) {
      const span = next.followers - prev.followers;
      const progress = span === 0 ? 0 : (followers - prev.followers) / span;
      return prev.score + progress * (next.score - prev.score);
    }
  }
  return 10;
}

export function calculateSocialScore(input: {
  followers?: number | null;
  posts?: number | null;
  avgLikes?: number | null;
}) {
  const followers = Math.max(0, input.followers ?? 0);
  if (followers === 0) return 0;

  let score = interpolateFollowers(followers);
  const posts = input.posts ?? null;
  const avgLikes = input.avgLikes ?? null;

  if (posts !== null) {
    if (posts >= 80) score += 0.5;
    else if (posts >= 25) score += 0.25;
    else if (posts <= 3) score -= 0.6;
  }

  if (avgLikes !== null && followers > 0) {
    const engagement = avgLikes / followers;
    if (engagement >= 0.05) score += 0.7;
    else if (engagement >= 0.02) score += 0.35;
    else if (engagement < 0.003) score -= 0.4;
  }

  return round(clamp(score, 0, 10));
}

export function calculateWebsiteScore(input: {
  mobileMenuWorking: boolean;
  impressumClickable: boolean;
  privacyClickable: boolean;
  contactFormFound: boolean;
  mailtoFound: boolean;
  phoneClickable: boolean;
  whatsappFound: boolean;
  brokenPopupDetected: boolean;
  lcp?: number | null;
  cls?: number | null;
  loadTime?: number | null;
}) {
  let score = 10;

  if (!input.mobileMenuWorking) score -= 2;
  if (!input.impressumClickable) score -= 3;
  if (!input.privacyClickable) score -= 3;
  if (!input.contactFormFound && !input.mailtoFound && !input.phoneClickable && !input.whatsappFound) score -= 1;
  if (input.brokenPopupDetected) score -= 1;

  const poorLcp = input.lcp !== null && input.lcp !== undefined && input.lcp > 4;
  const poorCls = input.cls !== null && input.cls !== undefined && input.cls > 0.25;
  const poorLoad = input.loadTime !== null && input.loadTime !== undefined && input.loadTime > 5;
  if (poorLcp || poorCls || poorLoad) score -= 1;

  return round(clamp(score, 0, 10));
}

export function calculateOpportunityScore(input: {
  socialScore?: number | null;
  websiteScore?: number | null;
  mobileMenuWorking: boolean;
  impressumClickable: boolean;
  privacyClickable: boolean;
  contactFormFound: boolean;
}) {
  let score = 0;
  score += (input.socialScore ?? 0) * 8;

  if (!input.mobileMenuWorking) score += 15;
  if (!input.impressumClickable) score += 10;
  if (!input.privacyClickable) score += 10;
  if (!input.contactFormFound) score += 10;
  if ((input.websiteScore ?? 10) < 4) score += 20;

  return round(clamp(score, 0, 100), 0);
}

export function getRecommendation(opportunityScore?: number | null): SocialAuditRecommendation {
  const score = opportunityScore ?? 0;
  const suggestedTime = "Montag 08:00";
  const services = [
    {
      name: "PF Fix",
      price: "250 EUR-500 EUR",
      fit: "Defekte Menus, Elementor-Probleme, Impressum, Datenschutz und Kontaktbuttons reparieren.",
    },
    {
      name: "PF Care",
      price: "49 EUR/Monat",
      fit: "Plugin-Updates, Monitoring, Backups, Broken-Link-Erkennung, Monatsreview und 30 Minuten Support.",
    },
    {
      name: "PF Signature Relaunch",
      price: "1500 EUR-3000 EUR",
      fit: "Mobile-first Redesign, SEO, schnelle Ladezeiten, Social-Media-Integration, Leadtracking und Analytics.",
    },
  ];

  if (score >= 90) return { label: "Sofort anrufen", action: "phone", suggestedTime, services };
  if (score >= 70) return { label: "Instagram DM", action: "dm", suggestedTime, services };
  if (score >= 50) return { label: "E-Mail", action: "email", suggestedTime, services };
  return { label: "Ignorieren", action: "ignore", suggestedTime, services };
}

export function withRecommendation(audit: Omit<SocialAudit, "recommendation">): SocialAudit {
  return {
    ...audit,
    recommendation: getRecommendation(audit.opportunityScore),
  };
}
