import { Agent, fetch as undiciFetch } from "undici";
import { assertSafeUrlSyntax, safeLookup, UnsafeTargetError } from "./netSafety";

// Live-Check einer Firmen-Website fuer den Anrufgrund. Die gespeicherten Leadfinder-
// Reasons sind teils veraltet oder falsch (Meta-Refresh/JS-Redirect als "kein Impressum"
// gewertet). Nur was hier LIVE bestaetigt wird, darf Connor am Telefon sagen.
//
// Zustaende:
//   DEAD    – Seite nachweislich weg (DNS fehlt, Verbindung verweigert, geparkt,
//             Server-Standardseite, 404/410 auf der Startseite)
//   WEAK    – erreichbar, mind. ein konkreter Befund
//   OK      – erreichbar, kein Befund -> kein Anrufgrund
//   UNKNOWN – nicht sicher bestimmbar (Timeout, 403/429/5xx, TLS-Sonderfall, JS-Shell,
//             SSRF-Block, Budget erschoepft) -> kein Anrufgrund

export type SiteVerdict = "DEAD" | "WEAK" | "OK" | "UNKNOWN";
export type DeadReason = "dns" | "refused" | "parked" | "default_page" | "not_found";

export type SiteFindings = {
  verdict: SiteVerdict;
  host: string;
  checkedAt: string;
  finalUrl?: string;
  httpStatus?: number;
  deadReason?: DeadReason;
  unknownReason?: string;
  flags: { noHttps?: boolean; noViewport?: boolean; noImpressumLink?: boolean };
  hops: string[]; // nur Hosts, kein Inhalt
};

export type FetchResult =
  | { kind: "response"; status: number; location: string | null; body: string }
  | { kind: "error"; code: string };

/** Netzwerk-Schicht, in Tests austauschbar. Folgt KEINEN Redirects selbst. */
export type Fetcher = (url: string, signal: AbortSignal) => Promise<FetchResult>;

export const LIMITS = {
  requestMs: 6_000,
  siteMs: 15_000,
  maxBodyBytes: 1536 * 1024,
  maxHops: 3,
};

let agent: Agent | null = null;
function getAgent() {
  if (!agent) {
    agent = new Agent({
      connect: { lookup: safeLookup as never, timeout: LIMITS.requestMs },
      headersTimeout: LIMITS.requestMs,
      bodyTimeout: LIMITS.requestMs,
      connections: 2,
    });
  }
  return agent;
}

function errorCode(err: unknown): string {
  const e = err as { name?: string; code?: string; cause?: { code?: string; name?: string } };
  const code = e?.cause?.code || e?.code || "";
  if (e?.name === "AbortError" || e?.name === "TimeoutError" || /TIMEOUT/i.test(code)) return "timeout";
  if (code === "EBLOCKED") return "blocked";
  if (code === "ENOTFOUND") return "dns";
  if (code === "EAI_AGAIN") return "dns_temp";
  if (code === "ECONNREFUSED") return "refused";
  if (code === "ECONNRESET" || code === "EPIPE" || code === "UND_ERR_SOCKET") return "reset";
  if (/^(ERR_TLS|ERR_SSL|CERT_|DEPTH_ZERO|SELF_SIGNED|UNABLE_TO_|ERR_OSSL|HOSTNAME_MISMATCH)/.test(code)) return "tls";
  if (/^(EHOSTUNREACH|ENETUNREACH)$/.test(code)) return "unreachable";
  return code ? `other:${code}` : "other";
}

/** Produktiver Fetcher: gepinnter DNS-Lookup, kein automatischer Redirect, Body-Limit. */
export const defaultFetcher: Fetcher = async (url, signal) => {
  try {
    const res = await undiciFetch(url, {
      method: "GET",
      redirect: "manual",
      dispatcher: getAgent(),
      signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; PageFoundry-SiteCheck/1.0; +https://pagefoundry.de)",
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
      },
    });
    let body = "";
    if (res.body && res.status >= 200 && res.status < 300) {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (size < LIMITS.maxBodyBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.byteLength;
      }
      await reader.cancel().catch(() => {});
      body = Buffer.concat(chunks).subarray(0, LIMITS.maxBodyBytes).toString("utf8");
    } else {
      await res.body?.cancel().catch(() => {});
    }
    return { kind: "response", status: res.status, location: res.headers.get("location"), body };
  } catch (err) {
    return { kind: "error", code: errorCode(err) };
  }
};

type PageResult =
  | { kind: "page"; status: number; body: string; truncated: boolean; finalUrl: string; hops: string[] }
  | { kind: "error"; code: string; hops: string[] };

// ── Lineare HTML-Hilfen ─────────────────────────────────────────────────────
// Keine Regexe mit unbegrenzten Wiederholungen ueber fremdes HTML: '<meta' x 50.000 ohne
// '>' liess die alte Fassung 25 s synchron rechnen und blockierte den ganzen Prozess.
// Alles hier ist O(n) mit begrenzten Teilstrings.

/** Alle Tags eines Namens (z. B. "meta"), Attribute als kleingeschriebener Teilstring (max. 600 Zeichen). */
function tagSnippets(lower: string, name: string, max = 200): string[] {
  const out: string[] = [];
  const needle = `<${name}`;
  let i = 0;
  while (out.length < max) {
    const at = lower.indexOf(needle, i);
    if (at < 0) break;
    const end = lower.indexOf(">", at);
    const stop = end < 0 ? Math.min(lower.length, at + 600) : Math.min(end, at + 600);
    out.push(lower.slice(at, stop));
    i = at + needle.length;
  }
  return out;
}

function attr(snippet: string, name: string): string | null {
  // Linear: Attributname mit Wortgrenze davor, erlaubte Leerzeichen um "=".
  let i = 0;
  while (i < snippet.length) {
    const at = snippet.indexOf(name, i);
    if (at < 0) return null;
    i = at + name.length;
    const prev = at > 0 ? snippet[at - 1] : " ";
    if (!(prev === " " || prev === "\t" || prev === "\n" || prev === "\r" || prev === '"' || prev === "'" || prev === "/")) continue;
    let j = i;
    while (j < snippet.length && /\s/.test(snippet[j])) j++;
    if (snippet[j] !== "=") continue;
    j++;
    while (j < snippet.length && /\s/.test(snippet[j])) j++;
    const q = snippet[j];
    if (q === '"' || q === "'") {
      const e = snippet.indexOf(q, j + 1);
      return e < 0 ? snippet.slice(j + 1, j + 401) : snippet.slice(j + 1, Math.min(e, j + 401));
    }
    let e = j;
    while (e < snippet.length && e < j + 400 && !/[\s>]/.test(snippet[e])) e++;
    return snippet.slice(j, e);
  }
  return null;
}

/** Sichtbarer Text (ohne script/style/Tags), linear per Zustandsmaschine. */
function visibleTextLength(html: string, cap = 2000): number {
  const lower = html.toLowerCase();
  let n = 0;
  let i = 0;
  let lastSpace = true;
  while (i < lower.length && n < cap) {
    const c = lower[i];
    if (c === "<") {
      if (lower.startsWith("<script", i) || lower.startsWith("<style", i)) {
        const close = lower.startsWith("<script", i) ? "</script" : "</style";
        const e = lower.indexOf(close, i + 1);
        if (e < 0) break;
        i = e + close.length;
        continue;
      }
      const e = lower.indexOf(">", i + 1);
      if (e < 0) break;
      i = e + 1;
      if (!lastSpace) { n++; lastSpace = true; }
      continue;
    }
    const space = c === " " || c === "\n" || c === "\t" || c === "\r";
    if (!(space && lastSpace)) n++;
    lastSpace = space;
    i++;
  }
  return n;
}

function metaRefreshTarget(lower: string, original: string): string | null {
  for (const sn of tagSnippets(lower, "meta", 50)) {
    if ((attr(sn, "http-equiv") || "") !== "refresh") continue;
    const content = (attr(sn, "content") || "").slice(0, 400);
    const m = content.match(/url\s*=\s*(\S+)/); // kurzer, begrenzter String
    if (!m) continue;
    const raw = m[1].trim().replace(/^['"]|['"]$/g, "");
    // Originalschreibweise (Gross/Klein im Pfad) aus dem Originaltext holen
    const pos = original.toLowerCase().indexOf(raw);
    return (pos >= 0 ? original.slice(pos, pos + raw.length) : raw).replace(/&amp;/g, "&");
  }
  return null;
}

const PARKED_MARKERS = ["domain is for sale", "domain may be for sale", "diese domain kaufen", "diese domain steht zum verkauf", "domain ist zu verkaufen", "sedoparking", "parkingcrew", "bodis.com", "this domain is parked", "domain parking", "dan.com/buy-domain"];
const DEFAULT_TITLES = ["web server's default page", "welcome to nginx", "apache2 ubuntu default page", "apache2 debian default page", "apache2 default page", "it works!", "test page for the apache", "iis windows server", "default web site page", "domain default page", "plesk"];
const DEFAULT_TEXT = ["this is the default welcome page", "this is the default page", "hier entsteht in kürze", "hier entsteht in kuerze", "baustellenseite des providers"];

export function analyzeHtml(body: string, truncated = false): { parked: boolean; defaultPage: boolean; jsShell: boolean; noViewport: boolean; noImpressumLink: boolean } {
  const lower = body.toLowerCase();
  const titleAt = lower.indexOf("<title");
  const title = titleAt >= 0 ? lower.slice(lower.indexOf(">", titleAt) + 1, lower.indexOf("</title", titleAt) > 0 ? lower.indexOf("</title", titleAt) : titleAt + 300).trim().slice(0, 200) : "";
  const textLen = visibleTextLength(body);
  const metas = tagSnippets(lower, "meta");
  return {
    parked: PARKED_MARKERS.some((m) => lower.includes(m)),
    defaultPage: DEFAULT_TITLES.some((t) => title.startsWith(t)) || DEFAULT_TEXT.some((t) => lower.includes(t)),
    jsShell: textLen < 150 && (lower.includes("<script") || lower.includes("<noscript") || lower.includes("location.href") || lower.includes("window.location")),
    noViewport: !metas.some((m) => (attr(m, "name") || "") === "viewport"),
    // Jede Erwaehnung zaehlt (Footer wird oft per Skript/JSON gebaut). Abgeschnittene Seiten
    // koennen das Impressum hinter der Grenze haben -> dann keine Behauptung.
    noImpressumLink: !truncated && !lower.includes("impressum") && !lower.includes("imprint"),
  };
}

/** Ruft eine URL ab und folgt bis zu maxHops Redirects (HTTP + Meta-Refresh), jeder Hop geprueft. */
async function fetchFollowing(start: string, fetcher: Fetcher, deadline: number): Promise<PageResult> {
  let url = start;
  const hops: string[] = [];
  for (let hop = 0; hop <= LIMITS.maxHops; hop++) {
    let parsed: URL;
    try {
      parsed = assertSafeUrlSyntax(url);
    } catch (e) {
      return { kind: "error", code: e instanceof UnsafeTargetError ? "blocked" : "invalid", hops };
    }
    hops.push(parsed.hostname);
    const left = deadline - Date.now();
    if (left <= 0) return { kind: "error", code: "budget", hops };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(LIMITS.requestMs, left));
    let r: FetchResult;
    try {
      r = await fetcher(parsed.toString(), ctrl.signal);
    } catch {
      r = { kind: "error", code: "other" };
    } finally {
      clearTimeout(timer);
    }
    if (r.kind === "error") return { kind: "error", code: r.code, hops };
    try {
      if (r.status >= 300 && r.status < 400 && r.location) {
        url = new URL(r.location, parsed).toString();
        continue;
      }
      if (r.status >= 200 && r.status < 300 && hop < LIMITS.maxHops) {
        const target = metaRefreshTarget(r.body.slice(0, 64 * 1024).toLowerCase(), r.body.slice(0, 64 * 1024));
        if (target) {
          url = new URL(target, parsed).toString();
          continue;
        }
      }
    } catch {
      return { kind: "error", code: "invalid_redirect", hops };
    }
    const truncated = Buffer.byteLength(r.body, "utf8") >= LIMITS.maxBodyBytes - 4;
    return { kind: "page", status: r.status, body: r.body, truncated, finalUrl: parsed.toString(), hops };
  }
  return { kind: "error", code: "too_many_redirects", hops };
}

function parseStored(website: string): URL | null {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(website) ? website : `http://${website}`);
  } catch {
    return null;
  }
}

// Profile auf Plattformen sind keine eigene Website (Fehlschluss im Realtest: facebook.com
// ohne Viewport als "Website schwach"). Solche Firmen laufen als "keine eigene Website".
const PLATFORM_HOSTS = ["facebook.com", "fb.com", "instagram.com", "linktr.ee", "google.com", "goo.gl", "business.site", "g.page", "yelp.de", "yelp.com",
  "gelbeseiten.de", "dasoertliche.de", "das-oertliche.de", "meinestadt.de", "11880.com", "golocal.de", "cylex.de", "branchenbuch.de", "werkenntdenbesten.de",
  "fleurop.de", "lieferando.de", "wolt.com", "ubereats.com", "treatwell.de", "doctolib.de", "jameda.de", "booksy.com", "planity.com", "shore.com", "tiktok.com",
  "xing.com", "linkedin.com", "youtube.com", "wa.me", "whatsapp.com", "ebay.de", "kleinanzeigen.de", "etsy.com", "amazon.de", "wikipedia.org", "tripadvisor.de", "tripadvisor.com"];

export function platformOf(website: string | null | undefined): string | null {
  if (!website) return null;
  const u = parseStored(website);
  if (!u) return null;
  const h = u.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  return PLATFORM_HOSTS.find((p) => h === p || h.endsWith(`.${p}`)) ?? null;
}

/** Live-Check einer Website. Wirft nie; jede Unsicherheit wird UNKNOWN. */
export async function checkSite(website: string, fetcher: Fetcher = defaultFetcher, now: () => number = Date.now): Promise<SiteFindings> {
  const checkedAt = new Date(now()).toISOString();
  const stored = parseStored(website);
  const host = stored?.hostname.toLowerCase().replace(/\.$/, "") || null;
  const base: SiteFindings = { verdict: "UNKNOWN", host: host || website, checkedAt, flags: {}, hops: [] };
  if (!host || !stored) return { ...base, unknownReason: "invalid_url" };
  try {
    assertSafeUrlSyntax(`http://${host}/`);
  } catch {
    return { ...base, unknownReason: "blocked" };
  }
  const deadline = now() + LIMITS.siteMs;
  const alt = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  const results: PageResult[] = [];
  const ok = (r: PageResult): r is Extract<PageResult, { kind: "page" }> => r.kind === "page" && r.status < 400;
  let page: Extract<PageResult, { kind: "page" }> | null = null;

  // 1) Startseite per https, dann http (Befunde beziehen sich immer auf die Startseite).
  const https = await fetchFollowing(`https://${host}/`, fetcher, deadline);
  results.push(https);
  if (ok(https)) page = https;
  if (!page) {
    const http = await fetchFollowing(`http://${host}/`, fetcher, deadline);
    results.push(http);
    if (ok(http)) page = http;
  }
  // 2) Gegenprobe: die tatsaechlich hinterlegte Adresse mit Pfad (https und http). Lebt sie,
  //    ist die Website nicht "kaputt" – und wir behaupten nichts ueber eine Startseite.
  const path = stored.pathname + stored.search;
  const pathAlive = async (): Promise<Extract<PageResult, { kind: "page" }> | null> => {
    if (!path || path === "/") return null;
    for (const u of [`https://${host}${path}`, `http://${host}${path}`]) {
      const r = await fetchFollowing(u, fetcher, deadline);
      results.push(r);
      if (ok(r)) {
        const a = analyzeHtml(r.body, r.truncated);
        if (!a.parked && !a.defaultPage) return r;
      }
    }
    return null;
  };
  if (!page) {
    const alive = await pathAlive();
    if (alive) return { ...base, hops: [...new Set(results.flatMap((x) => x.hops))], finalUrl: alive.finalUrl, httpStatus: alive.status, unknownReason: "root_missing_path_ok" };
  }
  // 3) Vor jedem "kaputt"-Urteil auch die www-/ohne-www-Variante pruefen.
  if (!page) {
    for (const u of [`https://${alt}/`, `http://${alt}/`]) {
      const r = await fetchFollowing(u, fetcher, deadline);
      results.push(r);
      if (ok(r)) {
        page = r;
        break;
      }
    }
  }
  const hops = [...new Set(results.flatMap((r) => r.hops))];
  if (results.some((r) => r.kind === "error" && (r.code === "blocked" || r.code === "budget" || r.code === "invalid_redirect"))) {
    const code = (results.find((r) => r.kind === "error" && ["blocked", "budget", "invalid_redirect"].includes(r.code)) as { code: string }).code;
    if (!page) return { ...base, hops, unknownReason: code };
  }

  if (page) {
    const a = analyzeHtml(page.body, page.truncated);
    const common = { ...base, hops, finalUrl: page.finalUrl, httpStatus: page.status };
    if (a.parked || a.defaultPage) {
      // Startseite geparkt/Standardseite, aber der hinterlegte Pfad lebt? Dann nicht "kaputt".
      const alive = await pathAlive();
      if (alive) return { ...common, hops: [...new Set(results.flatMap((x) => x.hops))], unknownReason: "root_placeholder_path_ok" };
      return { ...common, verdict: "DEAD", deadReason: a.parked ? "parked" : "default_page" };
    }
    if (a.jsShell) return { ...common, unknownReason: "js_shell" };
    if (platformOf(page.finalUrl)) return { ...common, unknownReason: "platform_redirect" };
    const flags: SiteFindings["flags"] = {};
    // "Kein HTTPS" nur, wenn die HTTPS-Variante eindeutig scheitert (verweigert/TLS-Fehler)
    // und die Seite selbst ueber http ausgeliefert wird.
    const finalIsHttp = page.finalUrl.startsWith("http:");
    if (finalIsHttp && https.kind === "error" && (https.code === "refused" || https.code === "tls")) flags.noHttps = true;
    if (a.noViewport) flags.noViewport = true;
    // "Kein Impressum-Link gefunden" ist allein zu unsicher (oft per Skript nachgeladen) und
    // klingt am Telefon nach Rechtsvorwurf -> nur Zusatzhinweis neben belastbaren Befunden.
    const hardFinding = Boolean(flags.noHttps || flags.noViewport);
    if (hardFinding && a.noImpressumLink) flags.noImpressumLink = true;
    return { ...common, verdict: hardFinding ? "WEAK" : "OK", flags };
  }

  const pages = results.filter((r): r is Extract<PageResult, { kind: "page" }> => r.kind === "page");
  const errors = results.filter((r): r is Extract<PageResult, { kind: "error" }> => r.kind === "error");
  const hardErr = (e: { code: string }) => e.code === "dns" || e.code === "refused";
  if (pages.length && pages.every((p) => p.status === 404 || p.status === 410) && errors.every(hardErr)) {
    return { ...base, hops, verdict: "DEAD", deadReason: "not_found", httpStatus: pages[0].status };
  }
  if (!pages.length && errors.length && errors.every((e) => e.code === "dns")) return { ...base, hops, verdict: "DEAD", deadReason: "dns" };
  if (!pages.length && errors.length && errors.every(hardErr)) return { ...base, hops, verdict: "DEAD", deadReason: "refused" };
  const status = pages[0]?.status;
  return { ...base, hops, httpStatus: status, unknownReason: status ? `http_${status}` : errors[0]?.code || "unknown" };
}

/** Anrufgrund in vorsichtiger, woertlicher Formulierung. null = kein Grund. */
export function reasonFromFindings(f: SiteFindings): string | null {
  const h = f.host.replace(/^www\./, "");
  if (f.verdict === "DEAD") {
    switch (f.deadReason) {
      case "dns": return `Die Domain ${h} ist derzeit nicht erreichbar (kein DNS-Eintrag gefunden).`;
      case "refused": return `${h} nimmt derzeit keine Verbindungen an.`;
      case "parked": return `Unter ${h} erscheint nur eine geparkte Domain-Seite.`;
      case "default_page": return `Unter ${h} erscheint nur eine Server-Standardseite statt einer Website.`;
      case "not_found": return `Die Startseite von ${h} liefert einen Fehler (HTTP ${f.httpStatus}).`;
    }
  }
  if (f.verdict === "WEAK") {
    const parts: string[] = [];
    if (f.flags.noHttps) parts.push("keine funktionierende HTTPS-Verbindung");
    if (f.flags.noViewport) parts.push("kein Viewport-Tag (Hinweis auf fehlende Mobil-Optimierung)");
    if (f.flags.noImpressumLink) parts.push("kein Impressum-Link auf der Startseite gefunden");
    return `Auf ${h} gefunden: ${parts.join(", ")}.`;
  }
  return null;
}
