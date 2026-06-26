export const SOCIAL_AUDIT_STATUSES = [
  "new",
  "contacted",
  "interested",
  "proposal_sent",
  "won",
  "lost",
  "ignored",
] as const;

export type SocialAuditStatus = (typeof SOCIAL_AUDIT_STATUSES)[number];

export type SocialAuditInput = {
  companyName?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  followers?: number;
  posts?: number;
  avgLikes?: number;
};

export type SocialAudit = {
  id: number;
  companyName: string | null;
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  followers: number | null;
  posts: number | null;
  avgLikes: number | null;
  socialScore: number | null;
  websiteScore: number | null;
  opportunityScore: number | null;
  mobileMenuWorking: boolean;
  contactFormFound: boolean;
  mailtoFound: boolean;
  phoneClickable: boolean;
  whatsappFound: boolean;
  impressumFound: boolean;
  impressumClickable: boolean;
  privacyFound: boolean;
  privacyClickable: boolean;
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  elementorDetected: boolean;
  brokenPopupDetected: boolean;
  lcp: number | null;
  cls: number | null;
  loadTime: number | null;
  issues: string[];
  status: SocialAuditStatus;
  createdAt: string;
  recommendation: SocialAuditRecommendation;
};

export type SocialAuditRecommendation = {
  label: string;
  action: "phone" | "dm" | "email" | "ignore";
  suggestedTime: string;
  services: Array<{
    name: string;
    price: string;
    fit: string;
  }>;
};

export type SocialAuditPatch = Partial<
  Omit<SocialAudit, "id" | "createdAt" | "recommendation">
>;

export type DiscoveryResult = {
  companyName: string | null;
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  followers: number | null;
  posts: number | null;
  avgLikes: number | null;
  issues: string[];
};

export type WebsiteAuditResult = {
  website: string;
  websiteScore: number;
  opportunityScore: number;
  mobileMenuWorking: boolean;
  contactFormFound: boolean;
  mailtoFound: boolean;
  phoneClickable: boolean;
  whatsappFound: boolean;
  impressumFound: boolean;
  impressumClickable: boolean;
  privacyFound: boolean;
  privacyClickable: boolean;
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  elementorDetected: boolean;
  brokenPopupDetected: boolean;
  lcp: number | null;
  cls: number | null;
  loadTime: number | null;
  issues: string[];
};
