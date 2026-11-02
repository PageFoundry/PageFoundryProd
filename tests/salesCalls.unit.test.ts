import assert from "node:assert/strict";
import { test } from "node:test";
import { firstValidPhoneDE, formatPhoneDE, isMobileDE, normalizePhoneDE, splitPhoneField } from "../src/lib/sales/phone";
import { isNrwPlz, nrwCity, NRW_PLZ_LIST } from "../src/lib/sales/nrwPlz";
import { assertSafeUrlSyntax, isBlockedAddress } from "../src/lib/sales/netSafety";
import { analyzeHtml, checkSite, reasonFromFindings, type Fetcher, type FetchResult } from "../src/lib/sales/siteCheck";
import { capPerPlzPrefix, compareRanked, detectBranch, isChainName, looksLikePersonName, prefilter, type LfCandidate } from "../src/lib/sales/ranking";
import { berlinDay, berlinLocalToUtc, callLogSchema, claimKeys, endOfBerlinDay, nextWorkdayMorning, planLogEffects } from "../src/lib/sales/callGuide";
import { isOutreachExcluded, outreachEmailKey } from "../src/lib/sales/outreachExclusions";

// ── Telefon ─────────────────────────────────────────────────────────────────
test("Telefon: E.164 fuer DE, Ausland und Unklares raus", () => {
  assert.equal(normalizePhoneDE("+49 (0) 2192 / 12 34-5", { assumeDE: false }), "+49219212345");
  assert.equal(normalizePhoneDE("0049 211 123456", { assumeDE: false }), "+49211123456");
  assert.equal(normalizePhoneDE("0211 123456", { assumeDE: false }), null, "national nur mit DE-Kontext");
  assert.equal(normalizePhoneDE("0211 123456", { assumeDE: true }), "+49211123456");
  assert.equal(normalizePhoneDE("+33 3 27 60 00 00", { assumeDE: true }), null);
  assert.equal(normalizePhoneDE("0033 327600000", { assumeDE: true }), null);
  assert.equal(normalizePhoneDE("123456", { assumeDE: true }), null);
  assert.equal(normalizePhoneDE("Tel.: 0211 123456", { assumeDE: true }), "+49211123456");
  assert.equal(normalizePhoneDE("0211 abc", { assumeDE: true }), null);
  assert.deepEqual(splitPhoneField("0211 1; 0172 2"), ["0211 1", "0172 2"]);
  assert.equal(firstValidPhoneDE("kaputt; 0172 1234567", { assumeDE: true }), "+491721234567");
  assert.equal(isMobileDE("+491721234567"), true);
  assert.equal(isMobileDE("+49211123456"), false);
  assert.match(formatPhoneDE("+49211123456"), /^\+49 \d+ \d+$/);
});

test("NRW-PLZ-Zuordnung", () => {
  assert.ok(NRW_PLZ_LIST.length > 800);
  assert.equal(isNrwPlz("42499"), true);
  assert.equal(nrwCity("42499"), "Hückeswagen");
  assert.equal(isNrwPlz("80331"), false);
  assert.equal(isNrwPlz(null), false);
});

// ── SSRF ────────────────────────────────────────────────────────────────────
test("SSRF: private, reservierte und Sonderadressen blockiert", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "198.18.0.1",
    "::", "::1", "fc00::1", "fd12::1", "fe80::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "64:ff9b::1.2.3.4", "2001:db8::1", "2002:7f00:1::1", "kein-ip"]) {
    assert.equal(isBlockedAddress(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "85.13.150.1", "2a00:1450:4001::1", "::ffff:8.8.8.8"]) assert.equal(isBlockedAddress(ip), false, ip);
  const bad = ["ftp://a.de/", "http://user:pw@a.de/", "http://a.de:8080/", "http://127.0.0.1/", "http://[::1]/", "http://localhost/", "http://intern.local/", "http://2130706433/", "http://0x7f.1/", "http://einwort/"];
  for (const u of bad) assert.throws(() => assertSafeUrlSyntax(u), Error, u);
  assert.equal(assertSafeUrlSyntax("https://www.firma.de/").hostname, "www.firma.de");
  assert.equal(assertSafeUrlSyntax("http://8.8.8.8/").hostname, "8.8.8.8");
});

// ── Website-Check ───────────────────────────────────────────────────────────
type Script = Record<string, FetchResult>;
function fakeFetcher(script: Script): Fetcher & { calls: string[] } {
  const calls: string[] = [];
  const f = Object.assign(async (url: string): Promise<FetchResult> => {
    calls.push(url);
    return script[url] ?? { kind: "error", code: "dns" };
  }, { calls });
  return f;
}
const page = (body: string, status = 200): FetchResult => ({ kind: "response", status, location: null, body });
const redirect = (location: string, status = 301): FetchResult => ({ kind: "response", status, location, body: "" });
const GOOD = `<html><head><meta name="viewport" content="width=device-width"><title>Firma</title></head><body>${"Text ".repeat(60)}<a href="/impressum">Impressum</a></body></html>`;

test("Website-Check: DNS weg auf allen Varianten -> DEAD", async () => {
  const f = await checkSite("www.weg.example", fakeFetcher({}));
  assert.equal(f.verdict, "DEAD");
  assert.equal(f.deadReason, "dns");
  assert.match(reasonFromFindings(f)!, /nicht erreichbar/);
});

test("Website-Check: www-Variante lebt -> nicht DEAD", async () => {
  const f = await checkSite("weg.example", fakeFetcher({ "https://www.weg.example/": page(GOOD) }));
  assert.equal(f.verdict, "OK");
  assert.equal(reasonFromFindings(f), null);
});

test("Website-Check: Meta-Refresh wird verfolgt, Befunde stammen von der Zielseite", async () => {
  const fx = fakeFetcher({
    "https://novis.example/": page('<meta http-equiv="Refresh" content="1; URL=https://novis.example/Novis">'),
    "https://novis.example/Novis": page(GOOD),
  });
  const f = await checkSite("novis.example", fx);
  assert.equal(f.verdict, "OK", "Weiterleitung darf kein 'kein Impressum' erzeugen");
});

test("Website-Check: Redirect auf interne Adresse -> UNKNOWN (blocked)", async () => {
  const f = await checkSite("evil.example", fakeFetcher({ "https://evil.example/": redirect("http://127.0.0.1/admin") }));
  assert.equal(f.verdict, "UNKNOWN");
  assert.equal(f.unknownReason, "blocked");
});

test("Website-Check: Default-Seite und geparkte Domain -> DEAD", async () => {
  const d = await checkSite("a.example", fakeFetcher({ "https://a.example/": page("<title>Web Server's Default Page</title>") }));
  assert.equal(d.verdict, "DEAD");
  assert.equal(d.deadReason, "default_page");
  const p = await checkSite("b.example", fakeFetcher({ "https://b.example/": page(`<p>Diese Domain kaufen ${"x ".repeat(100)}</p>`) }));
  assert.equal(p.deadReason, "parked");
});

test("Website-Check: schwache Seite -> WEAK mit woertlichen Befunden; kein-HTTPS nur bei eindeutigem Fehler", async () => {
  const weak = `<html><body>${"Text ".repeat(60)}</body></html>`;
  const f = await checkSite("alt.example", fakeFetcher({ "https://alt.example/": { kind: "error", code: "refused" }, "http://alt.example/": page(weak) }));
  assert.equal(f.verdict, "WEAK");
  assert.deepEqual(f.flags, { noHttps: true, noViewport: true, noImpressumLink: true });
  assert.match(reasonFromFindings(f)!, /kein Impressum-Link auf der Startseite gefunden/);
  const t = await checkSite("slow.example", fakeFetcher({ "https://slow.example/": { kind: "error", code: "timeout" }, "http://slow.example/": page(weak) }));
  assert.equal(t.flags.noHttps, undefined, "Timeout beweist kein fehlendes HTTPS");
});

test("Website-Check: 403/Timeout/JS-Shell -> UNKNOWN", async () => {
  assert.equal((await checkSite("x.example", fakeFetcher({ "https://x.example/": page("", 403), "http://x.example/": page("", 403) }))).verdict, "UNKNOWN");
  assert.equal((await checkSite("y.example", fakeFetcher({ "https://y.example/": { kind: "error", code: "timeout" }, "http://y.example/": { kind: "error", code: "timeout" } }))).verdict, "UNKNOWN");
  const shell = '<html><head><script src="/app.js"></script></head><body><div id="root"></div></body></html>';
  assert.equal((await checkSite("z.example", fakeFetcher({ "https://z.example/": page(shell) }))).unknownReason, "js_shell");
});

test("analyzeHtml erkennt Impressum auch als Linktext", () => {
  assert.equal(analyzeHtml('<a href="/rechtliches">Impressum</a>').noImpressumLink, false);
  assert.equal(analyzeHtml('<a href="/imprint">Legal</a>').noImpressumLink, false);
});

// ── Ranking ─────────────────────────────────────────────────────────────────
const cand = (over: Partial<LfCandidate>): LfCandidate => ({
  id: "c1", name: "Malerbetrieb Test", website: null, email: null, phone: "+49 2192 123456", plz: "42499", scanAt: null,
  salesProblemScore: 100, reasonKeys: [], phoneDupCount: 1, ...over,
});

test("Ranking-Vorfilter: Ausschluesse und Vor-Stufen", () => {
  assert.equal(prefilter(cand({ plz: "80331" })).ok, false);
  assert.equal(prefilter(cand({ phone: "+33 3 27 60 00 00" })).ok, false);
  assert.equal(prefilter(cand({ phoneDupCount: 2 })).ok, false);
  assert.equal(prefilter(cand({ reasonKeys: ["website_mismatch"] })).ok, false);
  assert.equal(prefilter(cand({ name: "Sparkasse Köln" })).ok, false);
  assert.equal(prefilter(cand({ name: "Uwe-Carsten Glatz" })).ok, false);
  assert.equal(prefilter(cand({ website: "appelmann.de/maerkte/standorte", reasonKeys: ["website_unreachable"] })).ok, false);
  const a = prefilter(cand({ website: "x.de", reasonKeys: ["website_unreachable"] }));
  assert.ok(a.ok && a.v.preTier === "A");
  const b = prefilter(cand({ website: "x.de", salesProblemScore: 50, reasonKeys: ["no_impressum"] }));
  assert.ok(b.ok && b.v.preTier === "B");
  assert.equal(prefilter(cand({ website: "x.de", salesProblemScore: 20, reasonKeys: ["no_og"] })).ok, false, "gute Seite");
  const c = prefilter(cand({}));
  assert.ok(c.ok && c.v.preTier === "C" && c.v.city === "Hückeswagen");
  // Stadt-Apotheke ist ein Betrieb, keine Behoerde
  assert.equal(prefilter(cand({ name: "Stadt-Apotheke" })).ok, true);
});

test("Personennamen-Heuristik und Branche", () => {
  assert.equal(looksLikePersonName("Verena Grebe"), true);
  assert.equal(looksLikePersonName("Dr. Gerhard Welsandt"), true);
  // echte Betriebe aus dem Bestand, die die alte Heuristik faelschlich als Person sah
  for (const biz of ["Neveling Glasbau", "Zum Roten Hahn", "Ristorante Rosso", "Foto Menken", "Parfümerie Becker", "La Luna"]) {
    assert.equal(looksLikePersonName(biz), false, biz);
  }
  assert.equal(looksLikePersonName("Friseur Hasan"), false);
  assert.equal(looksLikePersonName("Nikko"), false);
  assert.equal(looksLikePersonName("Müller GmbH"), false);
  assert.equal(isChainName("Marc O'Polo"), true);
  assert.equal(isChainName("Rewe Center Köln"), true);
  assert.equal(isChainName("Rewer Bau"), false);
  assert.equal(detectBranch("Pizzeria Aland"), "gastro");
  assert.equal(detectBranch("Haar Team 42"), "beauty");
  assert.equal(detectBranch("Novis-Bestattungen"), "bestattung");
});

test("Ranking: Stufe vor Festnetz vor E-Mail; PLZ-Deckel", () => {
  const mk = (id: string, tier: "A" | "B" | "C", isMobile: boolean, email: string | null) =>
    ({ c: cand({ id, email }), platform: null, phoneNorm: "+49", isMobile, preTier: tier, branch: null, city: null, tier });
  const list = [mk("1", "C", false, "a@b.de"), mk("2", "A", true, null), mk("3", "A", false, null), mk("4", "B", false, null), mk("5", "A", false, "x@y.de")];
  const sorted = [...list].sort(compareRanked("2026-11-02")).map((x) => x.c.id);
  assert.deepEqual(sorted, ["5", "3", "2", "4", "1"]);
  const capped = capPerPlzPrefix(list, 2);
  assert.equal(capped.length, 2);
});

// ── Zeit ────────────────────────────────────────────────────────────────────
test("Berliner Tag, Tagesende und Werktag (inkl. Sommerzeit)", () => {
  assert.equal(berlinDay(new Date("2026-11-01T23:30:00Z")), "2026-11-02");
  assert.equal(endOfBerlinDay("2026-11-02").toISOString(), "2026-11-02T23:00:00.000Z");
  assert.equal(endOfBerlinDay("2026-07-01").toISOString(), "2026-07-01T22:00:00.000Z");
  assert.equal(berlinLocalToUtc("2026-10-25", 9).toISOString(), "2026-10-25T08:00:00.000Z"); // Tag der Zeitumstellung
  // Freitag 15 Uhr -> Montag 9 Uhr
  assert.equal(nextWorkdayMorning(new Date("2026-11-06T14:00:00Z")).toISOString(), "2026-11-09T08:00:00.000Z");
});

// ── Protokoll ───────────────────────────────────────────────────────────────
const now = new Date("2026-11-02T10:00:00Z");
test("Protokoll-Schema: bedingte Pflichtfelder", () => {
  const s = callLogSchema(now);
  assert.equal(s.safeParse({ attemptId: "a", reached: "REACHED" }).success, false, "Ergebnis fehlt");
  assert.equal(s.safeParse({ attemptId: "a", reached: "NOT_REACHED", outcome: "NO_INTEREST" }).success, false);
  assert.equal(s.safeParse({ attemptId: "a", reached: "NOT_REACHED" }).success, true);
  assert.equal(s.safeParse({ attemptId: "a", reached: "REACHED", outcome: "CALLBACK" }).success, false);
  assert.equal(s.safeParse({ attemptId: "a", reached: "REACHED", outcome: "CALLBACK", callbackAt: "2026-11-01T10:00:00Z" }).success, false, "Vergangenheit");
  assert.equal(s.safeParse({ attemptId: "a", reached: "REACHED", outcome: "CALLBACK", callbackAt: "2026-11-03T10:00:00+01:00" }).success, true);
  assert.equal(s.safeParse({ attemptId: "a", reached: "REACHED", outcome: "HAS_NEW_WEBSITE", newWebsite: "kaputt" }).success, false);
  assert.equal(s.safeParse({ attemptId: "a", reached: "REACHED", outcome: "DEMO_BOOKED", demoEmail: "x@y.de" }).success, false, "Briefing fehlt");
  assert.equal(s.safeParse({ attemptId: "a", reached: "REACHED", outcome: "DEMO_BOOKED", demoEmail: "x@y.de", demoBriefing: "Malerbetrieb, will Anfragen über die Seite" }).success, true);
});

test("Folgen eines Protokolls: Status nur aufwaerts, Sperre dominiert, Wiedervorlage", () => {
  const cur = (leadStatus: any, task: any = null, blocked = false) => ({ leadStatus, task, blocked });
  assert.equal(planLogEffects({ reached: "REACHED", outcome: "DEMO_BOOKED" }, cur("NEW"), now).leadStatus, "MEETING");
  assert.equal(planLogEffects({ reached: "NOT_REACHED" }, cur("MEETING"), now).leadStatus, null, "keine Rueckstufung");
  assert.equal(planLogEffects({ reached: "REACHED", outcome: "OFFER_REQUESTED" }, cur("WON"), now).leadStatus, null, "abgeschlossen bleibt");
  const r1 = planLogEffects({ reached: "NOT_REACHED" }, cur("NEW"), now);
  assert.equal(r1.task.action, "upsert");
  const r3 = planLogEffects({ reached: "VOICEMAIL" }, cur("CONTACTED", { state: "OPEN", kind: "RETRY", failedAttempts: 2 }), now);
  assert.deepEqual(r3.task, { action: "close", state: "DONE", failedAttempts: 3 });
  const dnc = planLogEffects({ reached: "REACHED", outcome: "DO_NOT_CALL" }, cur("WON"), now);
  assert.equal(dnc.block, true, "Widerspruch gilt auch bei abgeschlossenem Lead");
  assert.equal(planLogEffects({ reached: "NOT_REACHED" }, cur("NEW", { state: "CANCELLED", kind: "RETRY", failedAttempts: 1 }), now).task.action, "none", "abgebrochene Wiedervorlage bleibt zu");
  assert.equal(planLogEffects({ reached: "NOT_REACHED" }, cur("NEW", null, true), now).task.action, "close", "gesperrt -> keine Wiedervorlage");
  const cb = planLogEffects({ reached: "REACHED", outcome: "CALLBACK", callbackAt: new Date("2026-11-03T09:00:00Z") }, cur("NEW"), now);
  assert.equal(cb.task.action === "upsert" && cb.task.kind, "CALLBACK");
});

test("Reservierungsschluessel und Outreach-Abgleich", () => {
  assert.deepEqual(claimKeys({ leadfinderId: "x", phoneNorm: "+49211", website: "https://www.Firma.de/a", emailNorm: "a@firma.de" }), ["lf:x", "ph:+49211", "host:firma.de", "mail:a@firma.de"]);
  assert.equal(outreachEmailKey("Max.Muster+news@Firma.de"), "maxmuster@firma.de");
  const ex = { leadfinderIds: new Set(["lf1"]), domains: new Set(["firma.de"]), emails: new Set(["maxmuster@x.de"]) };
  assert.equal(isOutreachExcluded(ex, { leadfinderId: "lf1" }), true);
  assert.equal(isOutreachExcluded(ex, { website: "https://www.firma.de/kontakt" }), true);
  assert.equal(isOutreachExcluded(ex, { email: "max.muster@x.de" }), true);
  assert.equal(isOutreachExcluded(ex, { leadfinderId: "lf2", website: "other.de" }), false);
});

// ── Regressionen aus Codex-Review 2026-11-02 und Realtest ──────────────────
test("HTML-Analyse ist linear (kein synchroner DoS durch präpariertes HTML)", () => {
  const evil = "<meta".repeat(Math.floor(1_000_000 / 5));
  const t = Date.now();
  analyzeHtml(evil);
  analyzeHtml("<a".repeat(300_000));
  analyzeHtml("<script>".repeat(100_000));
  assert.ok(Date.now() - t < 1500, `zu langsam: ${Date.now() - t} ms`);
});

test("Impressum: verschachtelte Links zaehlen, abgeschnittene Seiten -> keine Behauptung", () => {
  assert.equal(analyzeHtml('<a href="/?p=12"><span class="x">Impressum</span></a>').noImpressumLink, false);
  assert.equal(analyzeHtml('<script>{"footer":"Impressum"}</script>').noImpressumLink, false);
  assert.equal(analyzeHtml("<p>nix</p>", true).noImpressumLink, false, "truncated");
  assert.equal(analyzeHtml("<p>nix</p>", false).noImpressumLink, true);
});

test("Website-Check: hinterlegter Pfad lebt, Wurzel 404 -> nicht DEAD (UNKNOWN, kein Anrufgrund)", async () => {
  const f = await checkSite("https://kunde.example/betrieb/", fakeFetcher({ "https://kunde.example/betrieb/": page(GOOD), "https://kunde.example/": page("", 404), "http://kunde.example/": page("", 404) }));
  assert.notEqual(f.verdict, "DEAD");
  assert.equal(reasonFromFindings(f), null);
});

test("Website-Check: nur fehlender Impressum-Link ist kein Anrufgrund", async () => {
  const noImp = `<html><head><meta name="viewport" content="width=device-width"></head><body>${"Text ".repeat(60)}</body></html>`;
  const f = await checkSite("imp.example", fakeFetcher({ "https://imp.example/": page(noImp) }));
  assert.equal(f.verdict, "OK");
});

test("Website-Check: www-Variante wird auch bei verweigerter Verbindung geprueft", async () => {
  const f = await checkSite("kunde.example", fakeFetcher({
    "https://kunde.example/": { kind: "error", code: "refused" },
    "http://kunde.example/": { kind: "error", code: "refused" },
    "https://www.kunde.example/": page(GOOD),
  }));
  assert.equal(f.verdict, "OK");
});

test("Website-Check: ungueltiger Redirect -> UNKNOWN statt Exception", async () => {
  const f = await checkSite("x.example", fakeFetcher({ "https://x.example/": redirect("http://["), "http://x.example/": redirect("http://[") }));
  assert.equal(f.verdict, "UNKNOWN");
});

test("Plattform-Profil ist keine eigene Website", () => {
  const p = prefilter(cand({ name: "Pizzeria Mini Capri", website: "https://www.facebook.com/minicapri", salesProblemScore: 60, reasonKeys: ["no_mobile"] }));
  assert.ok(p.ok && p.v.preTier === "C" && p.v.platform === "facebook.com");
  assert.equal(prefilter(cand({ name: "IG BAU Mitgliederbüro Siegen" })).ok, false);
  assert.equal(prefilter(cand({ name: "Provinzial Versicherung Torsten Wolf" })).ok, false);
});
