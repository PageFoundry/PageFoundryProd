import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { calculateSocialScore, withRecommendation } from "./scoring";
import type { SocialAudit, SocialAuditPatch, SocialAuditStatus } from "./types";

type DbValue = string | number | null;

type SocialAuditRow = {
  id: number;
  company_name: string | null;
  website: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  followers: number | null;
  posts: number | null;
  avg_likes: number | null;
  social_score: number | null;
  website_score: number | null;
  opportunity_score: number | null;
  mobile_menu_working: number;
  contact_form_found: number;
  mailto_found: number;
  phone_clickable: number;
  whatsapp_found: number;
  impressum_found: number;
  impressum_clickable: number;
  privacy_found: number;
  privacy_clickable: number;
  robots_txt_found: number;
  sitemap_found: number;
  elementor_detected: number;
  broken_popup_detected: number;
  lcp: number | null;
  cls: number | null;
  load_time: number | null;
  issues_json: string | null;
  status: SocialAuditStatus;
  created_at: string;
};

const fieldMap: Record<keyof SocialAuditPatch, string> = {
  companyName: "company_name",
  website: "website",
  instagramUrl: "instagram_url",
  facebookUrl: "facebook_url",
  tiktokUrl: "tiktok_url",
  followers: "followers",
  posts: "posts",
  avgLikes: "avg_likes",
  socialScore: "social_score",
  websiteScore: "website_score",
  opportunityScore: "opportunity_score",
  mobileMenuWorking: "mobile_menu_working",
  contactFormFound: "contact_form_found",
  mailtoFound: "mailto_found",
  phoneClickable: "phone_clickable",
  whatsappFound: "whatsapp_found",
  impressumFound: "impressum_found",
  impressumClickable: "impressum_clickable",
  privacyFound: "privacy_found",
  privacyClickable: "privacy_clickable",
  robotsTxtFound: "robots_txt_found",
  sitemapFound: "sitemap_found",
  elementorDetected: "elementor_detected",
  brokenPopupDetected: "broken_popup_detected",
  lcp: "lcp",
  cls: "cls",
  loadTime: "load_time",
  issues: "issues_json",
  status: "status",
};

let db: Database.Database | null = null;

function getDbPath() {
  return process.env.SOCIAL_AUDIT_DB_PATH || path.join(process.cwd(), "data", "social-audit.sqlite");
}

function toBool(value: number | null | undefined) {
  return value === 1;
}

function toStorageValue(value: unknown): DbValue {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.trim() || null;
  return null;
}

function parseIssues(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((issue) => typeof issue === "string") : [];
  } catch {
    return [];
  }
}

function mapRow(row: SocialAuditRow): SocialAudit {
  return withRecommendation({
    id: row.id,
    companyName: row.company_name,
    website: row.website,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    tiktokUrl: row.tiktok_url,
    followers: row.followers,
    posts: row.posts,
    avgLikes: row.avg_likes,
    socialScore: row.social_score,
    websiteScore: row.website_score,
    opportunityScore: row.opportunity_score,
    mobileMenuWorking: toBool(row.mobile_menu_working),
    contactFormFound: toBool(row.contact_form_found),
    mailtoFound: toBool(row.mailto_found),
    phoneClickable: toBool(row.phone_clickable),
    whatsappFound: toBool(row.whatsapp_found),
    impressumFound: toBool(row.impressum_found),
    impressumClickable: toBool(row.impressum_clickable),
    privacyFound: toBool(row.privacy_found),
    privacyClickable: toBool(row.privacy_clickable),
    robotsTxtFound: toBool(row.robots_txt_found),
    sitemapFound: toBool(row.sitemap_found),
    elementorDetected: toBool(row.elementor_detected),
    brokenPopupDetected: toBool(row.broken_popup_detected),
    lcp: row.lcp,
    cls: row.cls,
    loadTime: row.load_time,
    issues: parseIssues(row.issues_json),
    status: row.status,
    createdAt: row.created_at,
  });
}

export function getSocialAuditDb() {
  if (db) return db;
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_audits (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      website TEXT,
      instagram_url TEXT,
      facebook_url TEXT,
      tiktok_url TEXT,
      followers INTEGER,
      posts INTEGER,
      avg_likes INTEGER,
      social_score REAL,
      website_score REAL,
      opportunity_score REAL,
      mobile_menu_working BOOLEAN DEFAULT 0,
      contact_form_found BOOLEAN DEFAULT 0,
      mailto_found BOOLEAN DEFAULT 0,
      phone_clickable BOOLEAN DEFAULT 0,
      whatsapp_found BOOLEAN DEFAULT 0,
      impressum_found BOOLEAN DEFAULT 0,
      impressum_clickable BOOLEAN DEFAULT 0,
      privacy_found BOOLEAN DEFAULT 0,
      privacy_clickable BOOLEAN DEFAULT 0,
      robots_txt_found BOOLEAN DEFAULT 0,
      sitemap_found BOOLEAN DEFAULT 0,
      elementor_detected BOOLEAN DEFAULT 0,
      broken_popup_detected BOOLEAN DEFAULT 0,
      lcp REAL,
      cls REAL,
      load_time REAL,
      issues_json TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'proposal_sent', 'won', 'lost', 'ignored')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_social_audits_status ON social_audits(status);
    CREATE INDEX IF NOT EXISTS idx_social_audits_opportunity ON social_audits(opportunity_score DESC);
    CREATE INDEX IF NOT EXISTS idx_social_audits_created ON social_audits(created_at DESC);
  `);
  return db;
}

export function listSocialAudits() {
  const rows = getSocialAuditDb()
    .prepare(
      `SELECT * FROM social_audits
       ORDER BY COALESCE(opportunity_score, 0) DESC, created_at DESC, id DESC`,
    )
    .all() as SocialAuditRow[];
  return rows.map(mapRow);
}

export function getSocialAudit(id: number) {
  const row = getSocialAuditDb().prepare("SELECT * FROM social_audits WHERE id = ?").get(id) as SocialAuditRow | undefined;
  return row ? mapRow(row) : null;
}

export function createSocialAudit(input: SocialAuditPatch) {
  const socialScore =
    input.socialScore ??
    calculateSocialScore({
      followers: input.followers,
      posts: input.posts,
      avgLikes: input.avgLikes,
    });

  const result = getSocialAuditDb()
    .prepare(
      `INSERT INTO social_audits (
        company_name, website, instagram_url, facebook_url, tiktok_url,
        followers, posts, avg_likes, social_score, issues_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      toStorageValue(input.companyName),
      toStorageValue(input.website),
      toStorageValue(input.instagramUrl),
      toStorageValue(input.facebookUrl),
      toStorageValue(input.tiktokUrl),
      toStorageValue(input.followers),
      toStorageValue(input.posts),
      toStorageValue(input.avgLikes),
      toStorageValue(socialScore),
      toStorageValue(input.issues ?? []),
      toStorageValue(input.status ?? "new"),
    );

  return getSocialAudit(Number(result.lastInsertRowid))!;
}

export function updateSocialAudit(id: number, patch: SocialAuditPatch) {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined) as Array<[keyof SocialAuditPatch, unknown]>;
  if (entries.length === 0) return getSocialAudit(id);

  const assignments: string[] = [];
  const values: DbValue[] = [];
  for (const [key, value] of entries) {
    const column = fieldMap[key];
    if (!column) continue;
    assignments.push(`${column} = ?`);
    values.push(toStorageValue(value));
  }

  if (assignments.length === 0) return getSocialAudit(id);
  getSocialAuditDb()
    .prepare(`UPDATE social_audits SET ${assignments.join(", ")} WHERE id = ?`)
    .run(...values, id);
  return getSocialAudit(id);
}

export function setSocialAuditStatus(id: number, status: SocialAuditStatus) {
  return updateSocialAudit(id, { status });
}
