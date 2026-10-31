import { websiteStages, taxNoteDe, websiteTermsDe } from "@/lib/websitePricing";

// Verkaufsmaterial fuer /sales. Preise kommen aus derselben Quelle wie die Website
// (src/lib/websitePricing.ts), damit Vertrieb und Website nie auseinanderlaufen.

export const SITE_URL = "https://pagefoundry.de";

export const salesPackages = websiteStages.map((s) => ({
  id: s.id,
  name: s.name,
  description: s.de,
  purchase: s.purchase,
  setup: s.setup,
  monthly: s.monthly,
  changes: s.changes,
}));

export const salesTaxNote = taxNoteDe;
export const salesTerms = websiteTermsDe;

export const salesOffers = [
  { name: "KI-Sichtbarkeits-Audit", detail: "Kostenloser Scan, Umsetzung zum Fixpreis 490 €", url: "https://audit.pagefoundry.de" },
  { name: "KI-Telefonassistenz", detail: "Telefonassistent für Betriebe", url: `${SITE_URL}/ki-telefonassistenz` },
  { name: "Website-Wache", detail: "Monitoring & Pflege bestehender Websites", url: `${SITE_URL}/website-wache` },
  { name: "Website-Rettung", detail: "Modernisierung veralteter Websites", url: `${SITE_URL}/website-rettung` },
];

export const salesDemos = [
  { name: "Sortech (Recycling)", url: "https://demo.pagefoundry.de/sortech/" },
  { name: "DF ServiceWerk (Handwerk)", url: "https://demo.pagefoundry.de/servicewerk/" },
  { name: "Räum-Xpert (Entrümpelung, mit CMS)", url: "https://demo.pagefoundry.de/raeum-xpert/" },
  { name: "The Loft (Gastronomie)", url: "https://demo.pagefoundry.de/theloft/" },
  { name: "Christliche Island-Tafel (Verein)", url: "https://demo.pagefoundry.de/islandtafel/" },
  { name: "Salis (mehrseitig mit CMS)", url: "https://demo.pagefoundry.de/salis/" },
  { name: "Bestattungen Schneider", url: "https://demo.pagefoundry.de/bestattungen-schneider-wermelskirchen/" },
  { name: "Referenz: CarbonCare", url: `${SITE_URL}/projekte/carbon-care` },
];

export function referralLink(code: string): string {
  return `${SITE_URL}/consultation?ref=${encodeURIComponent(code)}`;
}
