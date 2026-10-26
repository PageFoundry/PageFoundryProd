import type { Metadata } from "next";
import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import WebsitePackages from "@/components/WebsitePackages";
import { websiteStages } from "@/lib/websitePricing";
import { additionalProductKeys } from "@/lib/products";
import { getServerI18n } from "@/i18n/server";
import JsonLd, { regionalAreaServed } from "@/components/JsonLd";
import CaseStudyShowcase from "@/components/landing/CaseStudyShowcase";
import FounderTrust from "@/components/landing/FounderTrust";

const homeMetadata = {
  de: {
    title: "Webdesign & individuelle Software aus Hückeswagen | PageFoundry",
    description:
      "PageFoundry aus Hückeswagen baut Websites, Landingpages und individuelle Software für Unternehmen im Bergischen Land – inklusive Hosting, SEO und laufender Betreuung.",
    openGraphDescription:
      "Websites, Landingpages und individuelle Software aus Hückeswagen – mit echten Projekten, transparenten Preisen und einem festen Ansprechpartner.",
    locale: "de_DE",
    alternateLocale: "en_US",
  },
  en: {
    title: "Web Design & Custom Software from Hückeswagen | PageFoundry",
    description:
      "PageFoundry, based in Hückeswagen, Germany, builds websites, landing pages, and custom business software – including hosting, SEO, and ongoing technical care.",
    openGraphDescription:
      "Websites, landing pages, and custom software from Hückeswagen, Germany – backed by real client work, transparent prices, and one accountable partner.",
    locale: "en_US",
    alternateLocale: "de_DE",
  },
} as const;

const BASE_URL = "https://pagefoundry.de";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getServerI18n();
  const current = homeMetadata[lang];
  const path = lang === "en" ? "/en" : "/";
  const url = `${BASE_URL}${path}`;

  return {
    title: { absolute: current.title },
    description: current.description,
    alternates: {
      canonical: url,
      languages: {
        de: `${BASE_URL}/`,
        en: `${BASE_URL}/en`,
        "x-default": `${BASE_URL}/`,
      },
    },
    openGraph: {
      title: current.title,
      description: current.openGraphDescription,
      url,
      siteName: "PageFoundry",
      locale: current.locale,
      alternateLocale: [current.alternateLocale],
      type: "website",
      images: [{ url: "/PAGEfoundry.png", alt: "PageFoundry" }],
    },
    twitter: {
      card: "summary_large_image",
      title: current.title,
      description: current.openGraphDescription,
      images: ["/PAGEfoundry.png"],
    },
  };
}

function getOrganizationSchema(lang: "de" | "en") {
  const isDe = lang === "de";

  return {
    "@context": "https://schema.org",
    "@type": isDe ? "LocalBusiness" : "ProfessionalService",
    name: "PageFoundry",
    url: "https://pagefoundry.de",
    description: isDe
      ? "Webstudio aus Hückeswagen für Websites, Landingpages, individuelle Software, Hosting, SEO und laufende technische Betreuung."
      : "Web studio based in Hückeswagen, Germany, building websites, landing pages, custom software, hosting, SEO, and ongoing technical care.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kastanienweg 20a",
      postalCode: "42499",
      addressLocality: "Hückeswagen",
      addressCountry: "DE",
    },
    telephone: "+49 2192 8743999",
    email: "admin@pagefoundry.de",
    image: "https://pagefoundry.de/PAGEfoundry.png",
    logo: "https://pagefoundry.de/PAGEfoundry.png",
    founder: { "@type": "Person", name: "Fabian Franke" },
    areaServed: isDe ? regionalAreaServed : { "@type": "Country", name: "Germany" },
    ...(!isDe ? { availableLanguage: ["German", "English"] } : {}),
    priceRange: "€€",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: "+49 2192 8743999",
      email: "admin@pagefoundry.de",
      availableLanguage: ["German", "English"],
      url: "https://pagefoundry.de/consultation",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: isDe ? "Web-Leistungen" : "Web services",
      itemListElement: [
        ...websiteStages.map((stage) => ({ "@type": "Offer", price: stage.purchase, priceCurrency: "EUR", url: `https://pagefoundry.de/consultation?package=${stage.id}&modell=kauf`, itemOffered: { "@type": "Service", name: stage.name, description: isDe ? `${stage.de}. ${stage.scope}. Betreut nur für Unternehmen: ${stage.setup} € Einrichtung + ${stage.monthly} €/Monat für 24 Monate; danach ${stage.later} €/Monat.` : `${stage.en}. ${stage.scopeEn}. Managed for businesses only: EUR ${stage.setup} setup + EUR ${stage.monthly}/month for 24 months; then EUR ${stage.later}/month.` } })),
        ...[
          ["Betrieb", 25, "Hosting, Domain, SSL, Backups, Überwachung, Bericht; monatlich, Änderungen nach Aufwand"],
          ["Website-Wache", 49, "Monatlich: externe Überwachung, Frühwarnung, Monatsbericht"],
          ["Website-Wache Care", 99, "Monatlich: Website-Wache plus 60 Minuten Kleinfixes"],
          ["Google-Profil-Paket", 149, "Einmalig: Kategorien, Leistungen, Fotos, Bewertungslink"],
          ["AI-Readiness-Umsetzung", 490, "Einmalig, abgegrenzter Scope unter audit.pagefoundry.de"],
          ["KI-Telefonassistenz", 790, "Einrichtung plus 249 €/Monat, 300 Minuten inklusive, danach 0,45 €/Min"],
          ["Individuelle Software", 2500, "Festpreisprojekte ab 2.500 €"],
          ["Änderungen nach Aufwand", 19, "Je angefangene 15 Minuten"],
        ].map(([name, price, description]) => ({ "@type": "Offer", price, priceCurrency: "EUR", itemOffered: { "@type": "Service", name, description } })),
      ],
    },
  };
}

const copy = {
  de: {
    eyebrow: "Websites & Software · Hückeswagen",
    subline:
      "Ich arbeite allein und mit eigener KI-Werkstatt. Deshalb liegen meine Preise unter dem üblichen Agenturniveau: Websites ab 790 € zum Kauf, für Unternehmen auch betreut ab 190 € Einrichtung und 49 € im Monat.",
    proof: ["Websites", "Landingpages", "Betriebliche Software", "SEO", "Hosting", "Bergisches Land"],
    heroHeading: "Websites und Betriebssoftware. Gebaut und betreut von einem Ansprechpartner aus Hückeswagen.",
    heroLocation: "Hückeswagen · Bergisches Land · deutschlandweit",
    heroOffers: [
      {
        title: "Websites",
        text: "Für mehr Vertrauen beim ersten Kontakt und einen klaren Weg zur Anfrage.",
      },
      {
        title: "Betriebliche Software",
        text: "Individuelle Anwendungen für Rechnungen, Daten und Betriebsabläufe. Festpreisprojekte ab 2.500 €.",
      },
    ],
    workLabel: "02 - Ausgewählte Arbeiten",
    workHeading: "Nicht behauptet. Live.",
    caseLabels: {
      caseFile: "Projektakte",
      before: "Vorher",
      after: "Nachher",
      result: "Belegter Stand",
      proof: "Geprüfte Projektfakten",
      visit: "Live-Website öffnen",
      liveProject: "Live-Projekt",
    },
    cases: [
      {
        client: "Carbon Care",
        date: "Februar 2026",
        domain: "rechnung.carbon-care.de",
        url: "https://carbon-care.de",
        visitLabel: "Kundenwebsite öffnen",
        internalLink: {
          href: "/webdesign-bergisches-land",
          label: "Webdesign im Bergischen Land",
        },
        caseStudyLink: {
          href: "/projekte/carbon-care",
          label: "Projektseite ansehen",
        },
        image: "/work/carbon-care.jpg",
        imageAlt: "Individuelle Rechnungssoftware für Carbon Care: Rechnungsübersicht mit Status und Zahlungsstand (Demoansicht mit Beispieldaten)",
        scope: "Betriebliche Rechnungssoftware",
        headline: "Vom Neustart zur funktionierenden digitalen Basis.",
        problem:
          "0 eigene Web-Systeme: weder Website noch eigener, wiederholbarer Rechnungsablauf.",
        delivery:
          "Ich entwickelte eine Rechnungssoftware mit eigenem Datenmodell, Rechnungen, Status und Zahlungsstand.",
        result:
          "Die individuelle Rechnungssoftware ist seit Februar 2026 im Tagesbetrieb. Die Abbildung zeigt Beispieldaten.",
        evidenceSource: "Stand 22.04.26",
        metrics: [
          { value: "1", label: "Anwendung", detail: "Rechnungssoftware" },

          { value: "02/26", label: "Go-live", detail: "im laufenden Betrieb" },
        ],
      },
      {
        client: "The Loft",
        date: "Mai / Juni 2026",
        domain: "theloftbrunch.de",
        url: "https://theloftbrunch.de",
        internalLink: {
          href: "/website-rettung",
          label: "Bestehende Website überarbeiten",
        },
        caseStudyLink: {
          href: "/projekte/the-loft",
          label: "Projektseite ansehen",
        },
        image: "/work/the-loft.jpg",
        imageAlt: "Startseite von The Loft Brunch and Lunch in Wuppertal",
        scope: "Website-Relaunch · Gastronomie",
        headline: "Eine Website, die sich so hochwertig anfühlt wie der Ort.",
        problem:
          "WordPress-Theme mit Plugin-Stack; Atmosphäre, Öffnungszeiten und Besucherführung waren nicht klar priorisiert.",
        delivery:
          "Relaunch ohne zusätzliche Redaktionssoftware; Speisekarte, Atmosphäre und Besuchsinformationen werden klar geführt.",
        result:
          "Fünf Kernwünsche aus der Kundenfeedback-Runde sind im Relaunch umgesetzt; die statische Website ist live.",
        evidenceSource: "Archiv + Live · 07/26",
        metrics: [
          { value: "5", label: "Kernwünsche", detail: "aus Kundenfeedback" },
          { value: "0", label: "WordPress-Plugins", detail: "statische Auslieferung" },
          { value: "06/26", label: "Go-live", detail: "Relaunch live" },
        ],
      },
    ],
    founder: {
      label: "Persönliche Verantwortung",
      heading: "Eine Person. Vom ersten Entwurf bis zum laufenden Betrieb.",
      text:
        "Ich bin Fabian Franke, Founder & Developer von PageFoundry. Strategie, Design, Entwicklung und technische Betreuung verschwinden nicht in Übergaben – ich bleibe der direkte Ansprechpartner.",
      quote: "Ich mache Dinge dreimal manuell. Beim vierten Mal automatisiere ich sie.",
      role: "Founder & Developer",
      imageAlt: "Fabian Franke, Founder und Developer von PageFoundry",
      location: "Hückeswagen, Deutschland",
      locationLabel: "Standort",
      phoneLabel: "Telefon (mein KI-Assistent nimmt an, ich rufe zurück)",
      emailLabel: "E-Mail",
    },
    servicesLabel: "03 - Was ich baue",
    servicesHeading: "Websites für Kunden. Software für den Betrieb.",
    servicesText:
      "Zwei klare Angebote, ein direkter Ansprechpartner: nach außen eine Website, die Vertrauen schafft; nach innen Software, die Arbeit abnimmt.",
    painLabel: "Das Problem",
    painHeading: "Was kostet eine schlechte Website wirklich?",
    painCta: "Kostenlose Analyse",
    packagesLabel: "04 - Pakete",
    packagesHeading: "Websites, Software und laufender Betrieb.",
    packagesText:
      "Sie wählen eine Website-Stufe und Kauf oder Betreuung. Umfang, Zeitplan und Angebot stimme ich mit Ihnen persönlich ab.",
    offerPathsLabel: "Der passende Einstieg",
    offerPaths: [
      {
        key: "Build",
        title: "Websites",
        text: "Für Unternehmen, die ihr Angebot klar zeigen, Vertrauen aufbauen und leichter Anfragen erhalten möchten.",
        cta: "Website besprechen",
        href: "/consultation?package=sichtbar&modell=kauf",
      },
      {
        key: "Systems",
        title: "Betriebliche Software",
        text: "Festpreisprojekte ab 2.500 € für Rechnungen, Daten und wiederkehrende Betriebsabläufe. Carbon Care zeigt eine umgesetzte Rechnungssoftware.",
        cta: "Software besprechen",
        href: "/individuelle-software",
      },
      {
        key: "Care",
        title: "Hosting & Betreuung",
        text: "Für Erreichbarkeit, Updates und eine feste technische Verantwortung nach dem Launch.",
        cta: "Betreuung ansehen",
        href: "/website-wache",
      },
    ],
    allServicesHeading: "Zusatzleistungen und Software",
    allServicesText: "Transparente Einstiegspreise für klar umrissene Leistungen. Individuelle Kombinationen kläre ich vorab. Alle Preise sind Endpreise — als Kleinunternehmer nach § 19 UStG wird keine Umsatzsteuer ausgewiesen.",
    detailLinks: [
      { label: "Individuelle Software", href: "/individuelle-software" },
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "Webdesign Wipperfürth", href: "/webdesign-wipperfuerth" },
      { label: "Webdesign Wermelskirchen", href: "/webdesign-wermelskirchen" },
      { label: "Webdesign Remscheid", href: "/webdesign-remscheid" },
      { label: "Webdesign Radevormwald", href: "/webdesign-radevormwald" },
      { label: "SEO Hückeswagen", href: "/seo-hueckeswagen" },
      { label: "KI-Telefonassistenz", href: "/ki-telefonassistenz" },
      { label: "Website-Wache", href: "/website-wache" },
      { label: "Website-Rettung", href: "/website-rettung" },
      { label: "KI-Sichtbarkeits-Check", href: "https://audit.pagefoundry.de", external: true },
    ] as { label: string; href: string; external?: boolean }[],
    mobilePricesSummary: "Preisliste öffnen",
    mobilePricesHint: "Websites ab 790 € · betreut ab 190 € + 49 €/Monat (nur Unternehmen)",
    processLabel: "05 - Prozess",
    processHeading: "Ihr Fahrplan.",
    faqLabel: "06 - FAQ",
    faqHeading: "Häufige Fragen.",
    nextLabel: "Nächster Schritt",
    nextHeading: "Bereit für eine Website, die wirkt?",
    nextText:
      "In der kostenlosen Erstberatung priorisiere ich die Seiten und Hebel mit der größten Wirkung - ohne Verkaufsgespräch.",
    consultationCta: "Kostenlose Beratung buchen",
    packagesCta: "Pakete ansehen",
    detailLabel: "Im Detail",
    services: [
      {
        n: "01",
        title: "Websites",
        text: "Ihr Angebot wird schneller verstanden und führt klar zur nächsten Anfrage.",
        detail: "Enthält: Struktur, Gestaltung, mobile Umsetzung und klare Kontaktwege.",
      },
      {
        n: "02",
        title: "Betriebliche Software",
        text: "Weniger Listen, Rückfragen und Handarbeit bei den Abläufen, die Ihren Betrieb jeden Tag tragen.",
        detail: "Individuelle Anwendungen für Rechnungen, Daten und interne Prozesse.",
      },
      {
        n: "03",
        title: "Sichtbarkeit in Google",
        text: "Die richtigen Menschen sollen Sie finden und sofort verstehen, was Sie anbieten.",
        detail: "Dahinter: Suchintention, Seitentitel, Beschreibungen und interne Verlinkung.",
      },
      {
        n: "04",
        title: "Laufender Betrieb",
        text: "Nach dem Launch bleibt klar, wer sich um Erreichbarkeit, Änderungen und Sicherheit kümmert.",
        detail: "Hosting, Updates, Backups und Performance aus einer Hand.",
      },
    ],
    pain: [
      "Schwache Klickrate trotz Google-Impressionen",
      "Zu generische Seiten ohne klaren Suchfokus",
      "Langsame Ladezeiten, schlechte Core Web Vitals",
      "Niemand verantwortlich für Hosting, Bugs, Updates",
      "Agenturpreise ohne transparente Kalkulation",
    ],
    process: [
    {
        "title": "Antwort am selben Werktag",
        "text": "Ich antworte mit passender Stufe, Preisrahmen und Arbeitsprobe."
    },
    {
        "title": "Abstimmung",
        "text": "Ich kläre mit Ihnen Branche, Inhalte und Fotos per WhatsApp, Telefon oder schriftlich."
    },
    {
        "title": "Seitenplan und Vorschau-Link",
        "text": "Sie erhalten einen Seitenplan und eine Vorschau mit Ihren Inhalten."
    },
    {
        "title": "Korrektur und Abnahme",
        "text": "Eine Korrekturrunde ist enthalten. Danach nehmen Sie die Website mit einer Prüfliste ab."
    },
    {
        "title": "Online und betreut",
        "text": "Nach rund 10–14 Tagen geht die Website online, abhängig von Inhalten und Freigaben. Bei Betreuung oder Betrieb folgt der Monatsbericht."
    }
],
    faq: [
      {
        q: "Was kostet eine Website?",
        a: "Sichtbar kostet 790 €, Gefunden 1.390 € und Gebucht 2.490 € zum Kauf. Nur für Unternehmen gibt es alternativ Betreuung über 24 Monate: 190 € + 49 €/Monat, 390 € + 79 €/Monat oder 790 € + 119 €/Monat. Danach 25/39/59 € monatlich, mit einem Monat Frist kündbar. Den Umfang kläre ich mit Ihnen in der Beratung.",
      },
      {
        q: "Warum gibt es Impressionen, aber keine Klicks?",
        a: "Meist passen Snippet, Suchintention und Seiteninhalt nicht sauber zusammen. Dann erscheint die Website zwar in Google, überzeugt aber nicht zum Klick.",
      },
      {
        q: "Bauen Sie nur neue Seiten oder optimieren Sie auch bestehende?",
        a: "Beides. Wenn bestehende Seiten brauchbar sind, optimiere ich gezielt. Wo wichtige Suchintentionen fehlen, ergänze ich neue Landingpages.",
      },
      {
        q: "Kombinieren Sie SEO mit Hosting und Technik?",
        a: "Ja. Technische Schwächen, Performance und unklare Seitenstruktur wirken direkt darauf, ob Menschen Sie finden, verstehen und kontaktieren.",
      },
    ],
  },
  en: {
    eyebrow: "Websites & software · Hückeswagen, Germany",
    subline:
      "I work independently with my own AI workshop. That keeps my prices below typical agency levels: websites from €790 to purchase, or for businesses a managed plan from €190 setup and €49 per month.",
    proof: ["Websites", "Landing pages", "Business software", "SEO", "Hosting", "Bergisches Land"],
    heroHeading: "Websites and business software. Built and maintained by one point of contact in Hückeswagen.",
    heroLocation: "Hückeswagen · Bergisches Land · Germany-wide",
    heroOffers: [
      {
        title: "Websites",
        text: "For more trust at the first contact and a clearer path to an enquiry.",
      },
      {
        title: "Business software",
        text: "Custom applications for invoices, data and business workflows. Fixed-price projects from €2,500.",
      },
    ],
    workLabel: "02 - Selected work",
    workHeading: "Not claimed. Live.",
    caseLabels: {
      caseFile: "Case file",
      before: "Before",
      after: "After",
      result: "Documented status",
      proof: "Verified project facts",
      visit: "Visit live website",
      liveProject: "Live project",
    },
    cases: [
      {
        client: "Carbon Care",
        date: "February 2026",
        domain: "rechnung.carbon-care.de",
        url: "https://carbon-care.de",
        visitLabel: "Visit customer website",
        internalLink: {
          href: "/webdesign-bergisches-land",
          label: "Web design in the Bergisches Land (German)",
        },
        image: "/work/carbon-care.jpg",
        imageAlt: "Tailored invoicing software for Carbon Care: invoice overview with status and payment state (demo view with sample data)",
        scope: "Business invoicing software",
        headline: "From a new business to a working digital base.",
        problem:
          "0 dedicated web systems: no website and no dedicated, repeatable invoicing workflow.",
        delivery:
          "I built an invoicing application with a dedicated data model, invoice statuses and payment tracking.",
        result:
          "The custom invoicing software has been in daily use since February 2026. The image shows sample data.",
        evidenceSource: "As of 22 Apr 2026",
        metrics: [
          { value: "1", label: "Application", detail: "Invoicing software" },

          { value: "02/26", label: "Go-live", detail: "used in daily operations" },
        ],
      },
      {
        client: "The Loft",
        date: "May / June 2026",
        domain: "theloftbrunch.de",
        url: "https://theloftbrunch.de",
        internalLink: {
          href: "/website-rettung",
          label: "Improve an existing website (German)",
        },
        image: "/work/the-loft.jpg",
        imageAlt: "The Loft Brunch and Lunch homepage in Wuppertal",
        scope: "Website relaunch · Hospitality",
        headline: "A website that feels as premium as the place.",
        problem:
          "A WordPress theme with a plugin stack; atmosphere, opening hours, and visitor guidance were not clearly prioritized.",
        delivery:
          "A relaunch without a separate editing system; menu access, atmosphere, and visitor information are clearly guided.",
        result:
          "Five core requests from the client feedback round are implemented in the relaunch; the static website is live.",
        evidenceSource: "Archive + live · 07/26",
        metrics: [
          { value: "5", label: "Core requests", detail: "from client feedback" },
          { value: "0", label: "WordPress plugins", detail: "static delivery" },
          { value: "06/26", label: "Go-live", detail: "relaunch live" },
        ],
      },
    ],
    founder: {
      label: "Personal accountability",
      heading: "One person. From first direction to ongoing operation.",
      text:
        "I am Fabian Franke, Founder & Developer at PageFoundry. Strategy, design, development, and technical care do not disappear into handovers – I remain your direct point of contact.",
      quote: "I do things manually three times. The fourth time, I automate them.",
      role: "Founder & Developer",
      imageAlt: "Fabian Franke, Founder and Developer at PageFoundry",
      location: "Hückeswagen, Germany",
      locationLabel: "Location",
      phoneLabel: "Phone (my AI assistant answers; I call you back)",
      emailLabel: "Email",
    },
    servicesLabel: "03 - What we build",
    servicesHeading: "Websites for customers. Software for the business.",
    servicesText:
      "Two clear offers, one accountable partner: a website that builds trust outside and software that removes work inside.",
    painLabel: "The problem",
    painHeading: "What does a weak website really cost?",
    painCta: "Free analysis",
    packagesLabel: "04 - Packages",
    packagesHeading: "Websites, software, and ongoing care.",
    packagesText:
      "Choose a website stage and purchase or managed service. I agree the scope, timeline and quote with you personally.",
    offerPathsLabel: "Choose your starting point",
    offerPaths: [
      {
        key: "Build",
        title: "Websites",
        text: "For businesses that want to explain their offer clearly, build trust, and earn more enquiries.",
        cta: "Discuss a website",
        href: "/consultation?package=sichtbar&modell=kauf",
      },
      {
        key: "Systems",
        title: "Business software",
        text: "Fixed-price projects from €2,500 for invoices, data and business workflows. Carbon Care is an implemented invoicing application.",
        cta: "Discuss software",
        href: "/consultation?package=request_offer",
      },
      {
        key: "Care",
        title: "Hosting & ongoing care",
        text: "For uptime, updates, and clear technical ownership after launch.",
        cta: "Explore ongoing care",
        href: "/website-wache",
      },
    ],
    allServicesHeading: "Additional services and software",
    allServicesText: "Transparent starting prices for clearly scoped work. We clarify custom combinations before anything begins. All prices are final prices — as a small business under § 19 UStG (German VAT law), PageFoundry does not charge VAT.",
    detailLinks: [
      { label: "Webdesign Bergisches Land (German)", href: "/webdesign-bergisches-land" },
      { label: "SEO Hückeswagen (German)", href: "/seo-hueckeswagen" },
      { label: "AI Phone Assistant (German)", href: "/ki-telefonassistenz" },
      { label: "Website Watch (German)", href: "/website-wache" },
      { label: "Website Rescue (German)", href: "/website-rettung" },
      { label: "AI Search Readiness Check (German)", href: "https://audit.pagefoundry.de", external: true },
    ] as { label: string; href: string; external?: boolean }[],
    mobilePricesSummary: "Open full price list",
    mobilePricesHint: "Websites from €790 · managed from €190 + €49/month (businesses only)",
    processLabel: "05 - Process",
    processHeading: "Your project roadmap.",
    faqLabel: "06 - FAQ",
    faqHeading: "Common questions.",
    nextLabel: "Next step",
    nextHeading: "Ready for a website that works?",
    nextText:
      "In the free consultation, we prioritize the pages and levers with the biggest impact - without a sales call.",
    consultationCta: "Book free consultation",
    packagesCta: "See packages",
    detailLabel: "In detail",
    services: [
      {
        n: "01",
        title: "Websites",
        text: "Your offer is easier to understand and leads clearly to the next enquiry.",
        detail: "Includes structure, design, mobile delivery, and clear contact paths.",
      },
      {
        n: "02",
        title: "Business software",
        text: "Less manual work, fewer lists, and fewer follow-up questions in the workflows that matter every day.",
        detail: "Tailored applications for invoices, data, and internal processes.",
      },
      {
        n: "03",
        title: "Be found on Google",
        text: "The right people should find you and understand what you offer straight away.",
        detail: "Behind that: search intent, titles, descriptions, and internal linking.",
      },
      {
        n: "04",
        title: "Ongoing care",
        text: "After launch, it stays clear who looks after uptime, changes, and security.",
        detail: "Hosting, updates, backups, and performance in one place.",
      },
    ],
    pain: [
      "Low click-through rate despite Google impressions",
      "Generic pages without clear search intent",
      "Slow load times and weak Core Web Vitals",
      "No clear owner for hosting, bugs, and updates",
      "Agency pricing without transparent scope",
    ],
    process: [
    {
        "title": "Same-business-day reply",
        "text": "I reply with a suitable stage, price range and a work sample."
    },
    {
        "title": "Alignment",
        "text": "I clarify your business, content and photos via WhatsApp, phone or in writing."
    },
    {
        "title": "Page plan and preview link",
        "text": "You receive a page plan and a preview with your content."
    },
    {
        "title": "Revision and acceptance",
        "text": "One revision round is included, followed by acceptance using a checklist."
    },
    {
        "title": "Launch and operation",
        "text": "The website goes live in around 10–14 days, depending on content and approvals. Managed or operation plans include a monthly report."
    }
],
    faq: [
      {
        q: "What does a professional website cost?",
        a: "Purchase prices: Sichtbar €790, Gefunden €1,390, Gebucht €2,490. Managed plans for businesses only: €190 + €49/month, €390 + €79/month or €790 + €119/month for 24 months. From month 25: €25/€39/€59 monthly, cancellable with one month’s notice. I clarify your scope in a consultation.",
      },
      {
        q: "Why do impressions not turn into clicks?",
        a: "Usually snippet, search intent, and page content are not aligned. The page appears in Google but does not earn the click.",
      },
      {
        q: "Do you only build new sites?",
        a: "No. We also optimize existing sites when they are worth keeping, and add focused landing pages where search intent is missing.",
      },
      {
        q: "Do you combine SEO with hosting and technology?",
        a: "Yes. Technical issues, performance, and unclear structure directly affect whether people find, understand, and contact you.",
      },
    ],
  },
} as const;

export default async function LandingPage() {
  const { lang, t } = await getServerI18n();
  const c = copy[lang];
  const consultationHref = `/consultation?lang=${lang}`;
  const localizeConsultation = (href: string) =>
    href.startsWith("/consultation")
      ? `${href}${href.includes("?") ? "&" : "?"}lang=${lang}`
      : href;

  return (
    <div data-public-page className="relative z-10 text-pfText">
      <JsonLd data={getOrganizationSchema(lang)} />

      <section className="relative min-h-[82vh] overflow-hidden px-6 pb-20 pt-32 md:px-10 md:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfAccentDim md:h-[42rem] md:w-[42rem]" />

        <div className="mx-auto grid max-w-screen-xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="fade-in">
            <h1
              className="max-w-5xl font-display leading-[0.9] text-balance text-pfText"
              style={{ fontSize: "clamp(2.6rem, 4.5vw, 4.8rem)" }}
            >
              {c.heroHeading}
            </h1>
            <div className="my-8 h-px w-28 bg-gradient-to-r from-pfAccent to-transparent" />
          </div>

          <div className="fade-in-delay-2 max-w-xl lg:pt-12">
            <p className="mb-8 max-w-lg text-base leading-8 text-pfSubtle md:text-lg">{c.subline}</p>
            <div className="mb-8 grid gap-px overflow-hidden border border-pfBorder bg-pfBorder sm:grid-cols-2">
              {c.heroOffers.map((offer) => (
                <div key={offer.title} className="bg-pfCard p-5">
                  <h2 className="font-display text-2xl leading-none text-pfText">{offer.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-pfSubtle">{offer.text}</p>
                </div>
              ))}
            </div>
            <p className="mb-8 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-pfMuted">{c.heroLocation}</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href={consultationHref} className="btn-accent">
                {t("hero.ctaFree")} →
              </Link>
              <Link href="#packages" className="btn-outline">
                {t("hero.ctaSee")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="hidden overflow-hidden border-y border-pfBorder bg-pfSurface/70 py-4 sm:block">
        <div className="flex w-max animate-[marquee_32s_linear_infinite] gap-8 whitespace-nowrap font-mono text-[0.65rem] uppercase tracking-[0.22em] text-pfMuted">
          {[...c.proof, ...c.proof, ...c.proof].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-8">
              {item}
              <span className="text-pfAccent">/</span>
            </span>
          ))}
        </div>
      </section>

      <section className="border-b border-pfBorder bg-pfSurface/40 px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-screen-xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-5xl leading-none text-pfText md:text-8xl">{c.workHeading}</h2>
          </div>

          <CaseStudyShowcase cases={c.cases} labels={c.caseLabels} />
        </div>
      </section>

      <FounderTrust copy={c.founder} />

      <section className="px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-screen-xl">
          <div className="mx-auto mb-8 max-w-3xl text-center md:mb-12">
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {c.servicesHeading}
            </h2>
            <p className="mt-6 text-base leading-8 text-pfSubtle">{c.servicesText}</p>
          </div>

          <div className="grid overflow-hidden rounded-3xl border border-pfBorder bg-pfBorder sm:grid-cols-2">
            {c.services.map((service) => (
              <article key={service.n} className="bg-pfCard p-6 transition-colors hover:bg-pfCardHover md:min-h-64 md:p-8">
                <span className="font-mono text-[0.62rem] tracking-widest text-pfAccent">{service.n}</span>
                <h3 className="mt-8 font-display text-3xl leading-none text-pfText md:mt-12 md:text-4xl">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-pfSubtle md:mt-4 md:min-h-14 md:leading-7">{service.text}</p>
                <p className="mt-3 border-t border-pfBorder pt-3 text-xs leading-5 text-pfMuted">{service.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="bg-pfSurface px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-screen-xl">
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {c.packagesHeading}
            </h2>
            <p className="mt-6 text-base leading-8 text-pfSubtle">{c.packagesText}</p>
          </div>
          <div className="mb-12 grid gap-px overflow-hidden border border-pfBorder bg-pfBorder md:mb-20 lg:grid-cols-3">
            {c.offerPaths.map((path) => (
              <Link
                key={path.key}
                href={localizeConsultation(path.href)}
                className="group flex flex-col bg-pfCard p-6 transition-colors hover:bg-pfCardHover md:min-h-72 md:p-10"
              >
                <h3 className="mt-6 font-display text-3xl leading-none text-pfText md:mt-8 md:text-5xl">{path.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-6 text-pfSubtle md:mt-5 md:leading-7">{path.text}</p>
                <span className="mt-6 inline-flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-pfText transition-colors group-hover:text-pfAccent md:mt-8">
                  {path.cta} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>

          <WebsitePackages lang={lang} />

          <div className="mb-8 border-t border-pfBorder pt-10 text-center">
            <h3 className="font-display text-4xl leading-none text-pfText md:text-5xl">{c.allServicesHeading}</h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-pfSubtle">{c.allServicesText}</p>
          </div>

          <p className="mb-6 text-sm text-pfSubtle lg:hidden">{c.mobilePricesHint}</p>
          <div className="grid gap-px border border-pfBorder bg-pfBorder sm:grid-cols-2 lg:grid-cols-3">
            {additionalProductKeys.map((id) => <div key={id} className="bg-pfSurface"><PackageCard id={id} /></div>)}
          </div>

          {c.detailLinks.length > 0 && (
            <div className="mt-10 flex flex-col gap-4 border-t border-pfBorder pt-8 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="font-mono text-[0.7rem] uppercase tracking-widest text-pfMuted">
                {c.detailLabel}
              </span>
              {c.detailLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="btn-outline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label} ↗
                  </a>
                ) : (
                  <Link key={link.href} href={link.href} className="btn-outline">
                    {link.label}
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-screen-xl">
          <div className="mx-auto mb-8 max-w-3xl text-center md:mb-12">
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {c.processHeading}
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-3xl bg-pfBorder sm:grid-cols-2 lg:grid-cols-5">
            {c.process.map((step, index) => (
              <article key={step.title} className="min-h-60 bg-pfCard p-5 md:min-h-64 md:p-8">
                <div className="font-display text-5xl leading-none text-pfAccent opacity-60 md:text-7xl">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-6 font-display text-2xl leading-none text-pfText md:mt-8 md:text-3xl">{step.title}</h3>
                <p className="mt-3 text-xs leading-5 text-pfSubtle md:mt-4 md:text-sm md:leading-7">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-pfSurface px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 font-display text-5xl leading-none text-pfText md:text-7xl">
            {c.faqHeading}
          </h2>

          <div className="divide-y divide-pfBorder">
            {c.faq.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-base font-medium text-pfText transition-colors hover:text-pfAccent">
                  {item.q}
                  <span className="shrink-0 text-2xl leading-none text-pfAccent transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pt-4 text-sm leading-7 text-pfSubtle">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-20 text-center md:px-10 md:py-32">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfAccentDim md:h-[38rem] md:w-[38rem]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfBorderAccent md:h-[26rem] md:w-[26rem]" />

        <div className="relative mx-auto max-w-4xl">
          <h2
            className="font-display leading-[0.9] text-pfText"
            style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}
          >
            {c.nextHeading}
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-pfSubtle">{c.nextText}</p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href={consultationHref} className="btn-accent">
              {c.consultationCta} →
            </Link>
            <Link href="#packages" className="btn-outline">
              {c.packagesCta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
