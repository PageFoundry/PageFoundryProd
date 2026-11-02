import { createHash } from "node:crypto";
import { firstValidPhoneDE, isMobileDE } from "./phone";
import { isNrwPlz, nrwCity } from "./nrwPlz";
import { platformOf } from "./siteCheck";

// Auswahl und Reihenfolge der Anrufliste. Reine Funktionen (unit-testbar).
// Freigegeben von Fabian 2026-11-01: Stufe A > B > C, Mobilnummern abwerten.
// Das ist eine Bedarfs-Heuristik, keine gemessene Abschlusschance.

export type Tier = "A" | "B" | "C";

/** Rohdatensatz aus der Leadfinder-DB. */
export type LfCandidate = {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  plz: string | null;
  scanAt: Date | null;
  salesProblemScore: number | null;
  reasonKeys: string[];
  phoneDupCount: number;
};

export type Prefiltered = {
  c: LfCandidate;
  /** Hinterlegte "Website" ist nur ein Plattform-Profil (z. B. facebook.com). */
  platform: string | null;
  phoneNorm: string;
  isMobile: boolean;
  preTier: Tier;
  branch: Branch | null;
  city: string | null;
};

export type Branch = "gastro" | "handwerk" | "beauty" | "gesundheit" | "handel" | "dienstleistung" | "bestattung" | "auto" | "verein";

const BRANCH_WORDS: Array<[Branch, RegExp]> = [
  ["gastro", /(restaurant|pizzeria|pizza|grill|imbiss|döner|doener|kebab|caf[eé]|bistro|bar\b|kneipe|gastst[aä]tte|brauhaus|trattoria|sushi|wok|asia|burger|eiscaf|b[aä]ckerei|konditorei|metzgerei|fleischerei|catering|hotel|pension|gasthof|gasthaus)/i],
  ["handwerk", /(elektro|sanit[aä]r|heizung|dachdeck|maler|tischlerei|schreinerei|zimmerei|bauunternehm|\bbau\b|fliesen|garten|landschaftsbau|schlosserei|metallbau|metallgestaltung|glaserei|installateur|klempner|parkett|stuckateur|ger[uü]stbau|rollladen|haustechnik|k[aä]ltetechnik|schornstein|pflaster|entr[uü]mpelung|umz[uü]ge?|reinigung|geb[aä]udereinigung|hausmeister)/i],
  ["beauty", /(friseur|frisör|coiffeur|hair|haar|salon|barber|kosmetik|beauty|nagel|n[aä]gel|nails|fu[sß]pflege|massage|tattoo|piercing|wimpern|lash|waxing|sonnenstudio)/i],
  ["gesundheit", /(praxis|zahnarzt|zahn[aä]rzt|arzt|[aä]rztin|physio|ergotherap|logop[aä]d|heilpraktik|osteopath|psychotherap|tierarzt|tier[aä]rzt|hebamme|pflegedienst|optik|optiker|h[oö]rger[aä]t|apotheke|orthop[aä]d)/i],
  ["auto", /(autohaus|kfz|auto\b|autoservice|werkstatt|reifen|lackiererei|abschlepp|fahrschule|car\b|motorrad)/i],
  ["bestattung", /(bestattung|bestatter|grabmal|steinmetz)/i],
  ["handel", /(laden|shop|boutique|blumen|floristik|florist|buchhandlung|getr[aä]nke|kiosk|trinkhalle|juwelier|uhren|m[oö]bel|raumausstatt|textil|mode\b|schuh|fahrrad|zweirad|baumarkt|weinhandlung|feinkost|unverpackt|tabak)/i],
  ["dienstleistung", /(kanzlei|rechtsanwalt|anw[aä]lt|steuerber|versicherung|immobilien|makler|agentur|fotograf|fotostudio|druckerei|schneiderei|[aä]nderungsschneiderei|reparatur|schl[uü]sseldienst|nachhilfe|sprachschule|tanzschule|fitness|yoga|hundesalon|hundeschule|event|dj\b|computer|it-service|webdesign)/i],
  ["verein", /(verein|e\.\s?v\.|stiftung|tafel)/i],
];

export function detectBranch(name: string): Branch | null {
  for (const [b, re] of BRANCH_WORDS) if (re.test(name)) return b;
  return null;
}

// Behoerden, Konzerne, Filialen: keine Zielgruppe (und Grauzone noch grauer).
const NAME_BLACKLIST = new RegExp(
  [
    // Behoerden / oeffentliche Hand
    "botschaft", "konsulat", "stadtverwaltung", "^stadt\\s", "^gemeinde\\s", "kreisverwaltung", "landratsamt", "rathaus",
    "b[uü]rgeramt", "jobcenter", "agentur f[uü]r arbeit", "finanzamt", "polizei", "feuerwehr", "bundesamt",
    "bundesagentur", "landesamt", "landesbetrieb", "ministerium",
    // Gewerkschaften, Verbaende, Kammern, Parteien
    "gewerkschaft", "\\big bau\\b", "\\big metall\\b", "\\bverdi\\b", "ver\\.di", "mitgliederbüro", "mitgliederbuero", "\\bverband\\b", "kammer\\b",
    "\\bcdu\\b", "\\bspd\\b", "\\bfdp\\b", "die grünen", "\\bafd\\b", "die linke",
    // Banken, Ketten, Konzerne
    "sparkasse", "volksbank", "raiffeisenbank", "commerzbank", "deutsche bank", "postbank", "targobank",
    "deutsche post", "\\bdhl\\b", "\\bdpd\\b", "\\bgls\\b", "\\baldi\\b", "\\blidl\\b", "\\brewe\\b", "\\bedeka\\b",
    "\\bnetto\\b", "\\bpenny\\b", "kaufland", "rossmann", "^dm\\b", "mcdonald", "burger king", "\\bkfc\\b", "\\bsubway\\b",
    "starbucks", "vodafone", "telekom", "tankstelle", "\\baral\\b", "\\bshell\\b", "\\besso\\b",
    // Bildung, Kirche, Kliniken
    "\\bschule\\b", "gymnasium", "grundschule", "gesamtschule", "kindergarten", "\\bkita\\b", "kirchengemeinde",
    "pfarramt", "pfarrei", "krankenhaus", "klinikum", "universit", "hochschule",
  ].join("|"),
  "i"
);
const URL_BLACKLIST = /\/(standorte?|filialen?|maerkte|m[aä]rkte|stores?|locations?|filiale|niederlassungen?)(\/|$)/i;
const COMPANY_SUFFIX = /(gmbh|\bug\b|\bag\b|\bkg\b|\bohg\b|e\.\s?k\.|\bgbr\b|\binh\.|inhaber|&|\bund\b|\+|söhne|soehne|team|studio|service|\d)/i;

// Haeufige Vornamen (DE + verbreitete internationale). Ein Name gilt nur dann als
// moegliche Privatperson, wenn er mit einem Vornamen (oder Dr./Prof.) beginnt.
// Hintergrund: Eine reine Grossschreibungs-Heuristik warf auf echten Daten Betriebe
// wie "Neveling Glasbau", "Zum Roten Hahn" oder "Foto Menken" raus.
const FIRST_NAMES = new Set(`
alexander andreas anja andrea angelika anna anne annette antje antonia armin axel barbara bernd bettina birgit bjoern björn brigitte carina carola carsten christa christian christiane christina christine christoph claudia cornelia dagmar daniel daniela david denise dennis dieter dirk doris dominik doris edith elena elisabeth elke emma erik erika ernst eva fabian felix florian frank franz frauke friedrich gabi gaby gabriele georg gerd gerda gerhard gisela gudrun guenter günter guido hannah hans harald heidi heike heinz helga helmut hendrik herbert holger horst ina ines ingo ingrid irene iris jan jana jens jessica joachim jochen johann johannes jonas joerg jörg josef julia julian juergen jürgen jutta kai karin karl karsten katharina kathrin katja katrin kerstin kevin klaus kristina lars laura lea lena leon lisa lukas manfred manuel manuela marc marcel marco marcus maria marie marina mario mark markus martin martina marvin matthias max maximilian melanie michael michaela mike monika nadine natalie nicole niklas nils nina norbert olaf oliver patricia patrick paul peter petra philipp rainer ralf ralph regina reinhard renate rene rené robert roland rolf rudolf sabine sabrina sandra sarah sascha sebastian silke simon simone sonja stefan stefanie steffen stephan susanne sven swen tanja thomas thorsten tim timo tobias tom torsten ulrich ulla ulrike ursula ute uwe vanessa vera verena volker walter werner wilhelm wolfgang yvonne
ahmed ali amir antonio aylin babak can carlos deniz elif emre fatma francesco giovanni giuseppe hakan hasan hüseyin ibrahim ivan jose josé kemal luca marek mehmet mohamed mohammad mustafa natalia olga omar özlem pavel piotr sergej sergei tatjana tomasz yusuf
`.trim().split(/\s+/));

/** Vorname + Nachname ohne Firmenhinweis -> moeglicherweise Privatperson (Einzelunternehmer). */
export function looksLikePersonName(name: string): boolean {
  const n = name.trim();
  if (detectBranch(n) || COMPANY_SUFFIX.test(n)) return false;
  const tokens = n.split(/\s+/);
  if (tokens.length < 2 || tokens.length > 4) return false;
  let i = 0;
  while (i < tokens.length && /^(dr\.?|prof\.?)$/i.test(tokens[i])) i++;
  const hadTitle = i > 0;
  const first = (tokens[i] || "").toLowerCase().split("-")[0];
  if (!hadTitle && !FIRST_NAMES.has(first)) return false;
  const part = "[A-ZÄÖÜ][a-zäöüßéèáàç']+";
  const word = new RegExp(`^${part}(-${part})*$`);
  return tokens.slice(i).every((t) => word.test(t));
}

// Ketten/Franchise (Deutschland). Ergaenzt den Mehrfach-Telefonnummer-Filter.
const CHAIN_NAMES = new RegExp(
  "^(" + [
    "rewe", "edeka", "aldi", "lidl", "netto", "penny", "kaufland", "real", "globus", "tegut", "norma", "nahkauf",
    "rossmann", "dm", "müller", "budni", "douglas", "fielmann", "apollo", "apollo-optik", "pro optik", "kamps", "back-factory", "backwerk",
    "le crobag", "ditsch", "starbucks", "mcdonald's", "mcdonalds", "burger king", "kfc", "subway", "pizza hut", "domino's", "dominos", "call a pizza", "joey's", "vapiano", "nordsee",
    "deichmann", "kik", "tedi", "takko", "action", "woolworth", "h&m", "c&a", "zara", "primark", "esprit", "s.oliver", "marc o'polo", "tom tailor", "ernsting's family", "nkd", "adler",
    "media markt", "mediamarkt", "saturn", "expert", "euronics", "o2", "vodafone", "telekom", "1&1", "obi", "hornbach", "bauhaus", "toom", "hagebaumarkt", "globus baumarkt", "hellweg", "bauking",
    "fressnapf", "das futterhaus", "dehner", "thomas philipps", "jysk", "dänisches bettenlager", "ikea", "xxxlutz", "poco", "roller", "sconto",
    "tchibo", "thalia", "mayersche", "depot", "bijou brigitte", "pandora", "christ", "apotheke am", "sparda", "postbank", "deutsche post", "dhl", "hermes", "dpd", "ups",
    "aral", "shell", "esso", "jet", "total", "totalenergies", "avia", "star", "westfalen", "sixt", "europcar", "avis", "hertz", "ab-autovermietung",
    "kieser", "mcfit", "clever fit", "fitx", "injoy", "john reed", "jumpers", "easy apotheke", "medicum", "hörgeräte kind", "kind hörgeräte", "amplifon", "geers", "kochlöffel", "lotto",
    "provinzial", "allianz", "ergo", "huk", "huk-coburg", "lvm", "debeka", "signal iduna", "axa", "generali", "r+v", "württembergische", "zurich", "barmenia",
    "continentale", "gothaer", "devk", "hdi", "deutsche vermögensberatung", "dvag", "mlp", "swiss life", "volksbank", "sparkasse", "tui", "first reisebüro", "der reisebüro", "dertour",
    "a.t.u", "atu", "pit stop", "vergölst", "euromaster", "point s", "carglass", "mister minit", "klier", "essanelle", "cosmo", "hairkiller", "ryf",
  ].map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(\\s|$|-)",
  "i"
);

export function isChainName(name: string): boolean {
  return CHAIN_NAMES.test(name.trim());
}

export type RejectReason = "not_nrw" | "phone_invalid" | "phone_shared" | "mismatch" | "blacklist_name" | "chain" | "blacklist_url" | "person_name" | "good_site";

export function prefilter(c: LfCandidate): { ok: true; v: Prefiltered } | { ok: false; why: RejectReason } {
  if (!isNrwPlz(c.plz)) return { ok: false, why: "not_nrw" };
  // NRW-PLZ ist der DE-Kontext fuer nationale 0-Nummern.
  const phoneNorm = firstValidPhoneDE(c.phone, { assumeDE: true });
  if (!phoneNorm) return { ok: false, why: "phone_invalid" };
  if (c.phoneDupCount > 1) return { ok: false, why: "phone_shared" };
  if (c.reasonKeys.includes("website_mismatch")) return { ok: false, why: "mismatch" };
  if (NAME_BLACKLIST.test(c.name)) return { ok: false, why: "blacklist_name" };
  if (isChainName(c.name)) return { ok: false, why: "chain" };
  if (c.website && URL_BLACKLIST.test(c.website)) return { ok: false, why: "blacklist_url" };
  if (looksLikePersonName(c.name)) return { ok: false, why: "person_name" };

  const platform = platformOf(c.website);
  let preTier: Tier | null = null;
  if (platform) {
    preTier = "C"; // nur Profil auf einer Plattform, keine eigene Website
  } else if (c.website) {
    if (c.reasonKeys.includes("website_unreachable")) preTier = "A";
    else if ((c.salesProblemScore ?? 0) >= 40 && c.reasonKeys.some((k) => k === "no_impressum" || k === "no_mobile" || k === "no_https")) preTier = "B";
  } else {
    preTier = "C"; // keine (verlaessliche) Website gespeichert
  }
  if (!preTier) return { ok: false, why: "good_site" };
  return {
    ok: true,
    v: { c, platform, phoneNorm, isMobile: isMobileDE(phoneNorm), preTier, branch: detectBranch(c.name), city: nrwCity(c.plz) },
  };
}

const TIER_ORDER: Record<Tier, number> = { A: 0, B: 1, C: 2 };

/** Stabiler Tageszufall: gleiche Reihenfolge innerhalb eines Tages, neue am naechsten. */
export function dayHash(day: string, id: string): number {
  return createHash("sha256").update(`${day}:${id}`).digest().readUInt32BE(0);
}

export type Ranked = Prefiltered & { tier: Tier };

/** Vergleich: Stufe -> Festnetz vor Mobil -> E-Mail vorhanden -> Branche erkannt -> Bedarf -> Tageszufall. */
export function compareRanked(day: string) {
  return (a: Ranked, b: Ranked) =>
    TIER_ORDER[a.tier] - TIER_ORDER[b.tier] ||
    Number(a.isMobile) - Number(b.isMobile) ||
    Number(!a.c.email) - Number(!b.c.email) ||
    Number(!a.branch) - Number(!b.branch) ||
    (b.c.salesProblemScore ?? 0) - (a.c.salesProblemScore ?? 0) ||
    dayHash(day, a.c.id) - dayHash(day, b.c.id);
}

/** Vor-Reihenfolge fuer die Pruef-Warteschlange (nach Vor-Stufe). */
export function sortPrefiltered(list: Prefiltered[], day: string): Prefiltered[] {
  const cmp = compareRanked(day);
  return [...list].sort((a, b) => cmp({ ...a, tier: a.preTier }, { ...b, tier: b.preTier }));
}

/** Hoechstens maxPerPrefix Eintraege je 3-stelligem PLZ-Bereich (Streuung ueber NRW). */
export function capPerPlzPrefix<T extends { c: { plz: string | null } }>(list: T[], maxPerPrefix: number): T[] {
  const counts = new Map<string, number>();
  const out: T[] = [];
  for (const item of list) {
    const key = (item.c.plz || "").slice(0, 3);
    const n = counts.get(key) || 0;
    if (n >= maxPerPrefix) continue;
    counts.set(key, n + 1);
    out.push(item);
  }
  return out;
}
