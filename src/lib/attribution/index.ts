export type InitialProvenance = { observedSource: ObservedSource; entryPathname: string | null };
export const SELF_REPORTED_SOURCES = ["search", "recommendation", "social", "other"] as const;
export type SelfReportedSource = (typeof SELF_REPORTED_SOURCES)[number];
export const OBSERVED_SOURCES = ["organic_search", "referral", "campaign", "direct_or_unknown"] as const;
export type ObservedSource = (typeof OBSERVED_SOURCES)[number];

export const ALLOWED_ENTRY_PATHS = ["/", "/consultation", "/website-wache", "/website-rettung", "/seo-hueckeswagen", "/webdesign-bergisches-land", "/ki-telefonassistenz"] as const;
const SEARCH_HOSTS = new Set(["google.com", "www.google.com", "google.de", "www.google.de", "bing.com", "www.bing.com", "bing.de", "www.bing.de", "duckduckgo.com", "www.duckduckgo.com", "ecosia.org", "www.ecosia.org"]);

export function parseObservedProvenance(input: { referrer?: string; href?: string; pathname?: string }): {
  observedSource: ObservedSource;
  entryPathname: string | null;
} {
  let observedSource: ObservedSource = "direct_or_unknown";
  try {
    const referrer = input.referrer ? new URL(input.referrer) : null;
    const current = input.href ? new URL(input.href) : null;
    const hasCampaign = Boolean(current?.searchParams.has("utm_source") || current?.searchParams.has("utm_medium") || current?.searchParams.has("utm_campaign"));
    if (hasCampaign) observedSource = "campaign";
    else if (referrer && SEARCH_HOSTS.has(referrer.hostname.toLowerCase())) observedSource = "organic_search";
    else if (referrer && !["pagefoundry.de", "www.pagefoundry.de", "localhost", "127.0.0.1"].includes(referrer.hostname.toLowerCase()) && !referrer.hostname.endsWith(".pagefoundry.de")) observedSource = "referral";
  } catch {
    observedSource = "direct_or_unknown";
  }
  const pathname = input.pathname || "";
  return { observedSource, entryPathname: (ALLOWED_ENTRY_PATHS as readonly string[]).includes(pathname) ? pathname : null };
}

export function isSelfReportedSource(value: unknown): value is SelfReportedSource {
  return typeof value === "string" && (SELF_REPORTED_SOURCES as readonly string[]).includes(value);
}
