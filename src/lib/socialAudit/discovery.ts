import { load } from "cheerio";
import type { DiscoveryResult, SocialAuditInput } from "./types";

const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
  "threads.net",
  "x.com",
  "twitter.com",
  "whatsapp.com",
  "wa.me",
];

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function normalizeProfileUrl(value: string | null | undefined) {
  const trimmed = cleanText(value);
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^@/, "")}`;
}

export function normalizeWebsiteUrl(value: string | null | undefined) {
  const trimmed = cleanText(value);
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function profileSlug(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const slug = parsed.pathname.split("/").filter(Boolean).find((part) => !["reel", "p", "videos"].includes(part));
    if (!slug) return null;
    return slug
      .replace(/^@/, "")
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return null;
  }
}

function parseHumanNumber(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/(\d)\.(?=\d{3}\b)/g, "$1");
  const match = normalized.match(/([\d.]+)([kKmMbB])?/);
  if (!match) return null;
  const base = Number.parseFloat(match[1]);
  if (!Number.isFinite(base)) return null;
  const suffix = match[2]?.toLowerCase();
  const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : suffix === "b" ? 1_000_000_000 : 1;
  return Math.round(base * multiplier);
}

function extractMetric(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const parsed = parseHumanNumber(match?.[1]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function decodeJsonString(value: string) {
  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
  } catch {
    return value;
  }
}

function unwrapRedirect(rawHref: string) {
  try {
    const parsed = new URL(rawHref);
    const target = parsed.searchParams.get("u") || parsed.searchParams.get("url") || parsed.searchParams.get("target");
    if (target) return decodeURIComponent(target);
  } catch {
    return rawHref;
  }
  return rawHref;
}

function isPotentialWebsite(rawHref: string, socialUrls: Array<string | null>) {
  const normalized = normalizeWebsiteUrl(unwrapRedirect(rawHref));
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (SOCIAL_HOSTS.some((socialHost) => host === socialHost || host.endsWith(`.${socialHost}`))) return null;
    if (host.includes("cdn") || host.includes("static") || host.includes("googleusercontent")) return null;
    if (socialUrls.some((url) => url && normalized.startsWith(url))) return null;
    return normalized;
  } catch {
    return null;
  }
}

function extractWebsiteFromHtml(html: string, socialUrls: Array<string | null>) {
  const candidates = new Set<string>();
  const $ = load(html);

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const candidate = href ? isPotentialWebsite(href, socialUrls) : null;
    if (candidate) candidates.add(candidate);
  });

  const externalUrlMatches = html.matchAll(/"external_url"\s*:\s*"([^"]+)"/gi);
  for (const match of externalUrlMatches) {
    const candidate = isPotentialWebsite(decodeJsonString(match[1]).replace(/\\\//g, "/"), socialUrls);
    if (candidate) candidates.add(candidate);
  }

  const rawUrlMatches = html.matchAll(/https?:\\?\/\\?\/[^\s"'<>\\]+|www\.[^\s"'<>\\]+/gi);
  for (const match of rawUrlMatches) {
    const candidate = isPotentialWebsite(match[0].replace(/\\\//g, "/"), socialUrls);
    if (candidate) candidates.add(candidate);
  }

  return [...candidates][0] ?? null;
}

async function fetchProfileHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "accept-language": "de-DE,de;q=0.9,en;q=0.8",
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractProfileStats(html: string) {
  const $ = load(html);
  const metaText = [
    $("meta[property='og:description']").attr("content"),
    $("meta[name='description']").attr("content"),
    $("title").text(),
    $("body").text(),
  ]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");

  return {
    followers: extractMetric(metaText, [
      /([\d.,]+\s*[kKmMbB]?)\s+Followers/i,
      /followers["'\s:]+([\d.,]+\s*[kKmMbB]?)/i,
      /([\d.,]+\s*[kKmMbB]?)\s+Follower/i,
    ]),
    posts: extractMetric(metaText, [
      /([\d.,]+\s*[kKmMbB]?)\s+Posts/i,
      /posts["'\s:]+([\d.,]+\s*[kKmMbB]?)/i,
      /([\d.,]+\s*[kKmMbB]?)\s+Beitr/i,
    ]),
    avgLikes: extractMetric(metaText, [
      /([\d.,]+\s*[kKmMbB]?)\s+Likes/i,
      /likes["'\s:]+([\d.,]+\s*[kKmMbB]?)/i,
    ]),
    titleCompany: cleanText($("meta[property='og:title']").attr("content") || $("title").text())
      .replace(/\(@[^)]+\)/g, "")
      .replace(/\|.*$/g, "")
      .replace(/Instagram.*$/i, "")
      .replace(/TikTok.*$/i, "")
      .replace(/Facebook.*$/i, "")
      .trim(),
  };
}

function numericOverride(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === "string") return parseHumanNumber(value);
  return null;
}

export async function discoverSocialAuditInput(input: SocialAuditInput): Promise<DiscoveryResult> {
  const instagramUrl = normalizeProfileUrl(input.instagram);
  const facebookUrl = normalizeProfileUrl(input.facebook);
  const tiktokUrl = normalizeProfileUrl(input.tiktok);
  const socialUrls = [instagramUrl, facebookUrl, tiktokUrl];
  const issues: string[] = [];

  let website = normalizeWebsiteUrl(input.website);
  let followers = numericOverride(input.followers);
  let posts = numericOverride(input.posts);
  let avgLikes = numericOverride(input.avgLikes);
  let companyName = cleanText(input.companyName) || null;

  for (const url of socialUrls.filter(Boolean) as string[]) {
    const html = await fetchProfileHtml(url);
    if (!html) {
      issues.push(`Social profile not readable: ${url}`);
      continue;
    }

    const stats = extractProfileStats(html);
    followers ??= stats.followers;
    posts ??= stats.posts;
    avgLikes ??= stats.avgLikes;
    companyName ??= stats.titleCompany || profileSlug(url);
    website ??= extractWebsiteFromHtml(html, socialUrls);
  }

  companyName ??= profileSlug(instagramUrl) || profileSlug(facebookUrl) || profileSlug(tiktokUrl) || "Unbekannt";

  if (!website) issues.push("No website found");

  return {
    companyName,
    website,
    instagramUrl,
    facebookUrl,
    tiktokUrl,
    followers,
    posts,
    avgLikes,
    issues,
  };
}
