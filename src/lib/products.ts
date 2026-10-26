export const productDisplayInfo = {
  "sichtbar": {
    "title": "Sichtbar",
    "desc": "A one-page website. Up to 6 sections.",
    "from": "€790"
  },
  "gefunden": {
    "title": "Gefunden",
    "desc": "Company website with local SEO foundations. Up to 5 pages, contact form and Google Business Profile setup.",
    "from": "€1,390"
  },
  "gebucht": {
    "title": "Gebucht",
    "desc": "Website with booking, enquiry or shop functionality. Up to 10 content pages or up to 5 pages plus exactly one standard module.",
    "from": "€2,490"
  },
  "betrieb": {
    "title": "Betrieb",
    "desc": "Hosting, domain, SSL, backups, monitoring and report. For purchased or existing sites I host. Changes billed separately; cancel with one month’s notice.",
    "from": "€25/month"
  },
  "website_wache": {
    "title": "Website-Wache",
    "desc": "External uptime, SSL and loading-time monitoring, alerts and monthly report.",
    "from": "€49/month"
  },
  "website_wache_care": {
    "title": "Website-Wache Care",
    "desc": "Website Watch plus 60 minutes of small fixes per month.",
    "from": "€99/month"
  },
  "google_profil": {
    "title": "Google-Profil-Paket",
    "desc": "I set up or tidy your business profile: categories, services, photos and review link.",
    "from": "€149 once"
  },
  "ai_readiness": {
    "title": "AI-Readiness-Umsetzung",
    "desc": "llms.txt, JSON-LD where useful, up to 3 evidenced technical findings, compact information/FAQ section, live verification and completion evidence, one correction round for implementation errors. Around 4 hours maximum; no migrations, new pages, extensive copy or image work.",
    "from": "€490 once"
  },
  "ki_telefon": {
    "title": "KI-Telefonassistenz",
    "desc": "€790 setup + €249/month. 300 minutes included, then €0.45/min.",
    "from": "€790 + €249/month"
  },
  "software": {
    "title": "Individuelle Software",
    "desc": "I build custom applications for invoices, data and business workflows. Fixed-price projects from €2,500.",
    "from": "from €2,500"
  },
  "extra_work": {
    "title": "Änderungen nach Aufwand",
    "desc": "Additional work agreed with you in advance.",
    "from": "€19 / started 15 min"
  },
  "request_offer": {
    "title": "Angebot anfragen",
    "desc": "I clarify your requirements and prepare a quote.",
    "from": "On request"
  },
  "free_consultation": {
    "title": "Kostenlose Beratung",
    "desc": "Talk to me about scope, timeline and budget.",
    "from": "Free"
  },
  "landing_page": {
    "title": "landing_page",
    "desc": "This historical offer is no longer available. Please request a consultation.",
    "from": "Consultation"
  },
  "landing_page_hosting": {
    "title": "landing_page_hosting",
    "desc": "This historical offer is no longer available. Please request a consultation.",
    "from": "Consultation"
  },
  "all_inclusive": {
    "title": "all_inclusive",
    "desc": "This historical offer is no longer available. Please request a consultation.",
    "from": "Consultation"
  },
  "seo_basic": {
    "title": "seo_basic",
    "desc": "This historical offer is no longer available. Please request a consultation.",
    "from": "Consultation"
  },
  "seo_advanced": {
    "title": "seo_advanced",
    "desc": "This historical offer is no longer available. Please request a consultation.",
    "from": "Consultation"
  },
  "speed_opt": {
    "title": "speed_opt",
    "desc": "This historical offer is no longer available. Please request a consultation.",
    "from": "Consultation"
  },
  "maintenance": {
    "title": "maintenance",
    "desc": "This historical offer is no longer available. Please request a consultation.",
    "from": "Consultation"
  }
} as const;

export type ProductKey = keyof typeof productDisplayInfo;
export const legacyProductKeys = ["landing_page", "landing_page_hosting", "all_inclusive", "seo_basic", "seo_advanced", "speed_opt", "maintenance"] as const;
export const productOrderKeys: ProductKey[] = ["sichtbar", "gefunden", "gebucht", "betrieb", "website_wache", "website_wache_care", "google_profil", "ai_readiness", "ki_telefon", "software", "extra_work", "request_offer", "free_consultation"];
export const additionalProductKeys = productOrderKeys.filter((id) => !["sichtbar", "gefunden", "gebucht"].includes(id));
export default productDisplayInfo;
