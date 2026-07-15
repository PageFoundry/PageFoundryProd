import type { Metadata } from "next";
import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import { productOrderKeys } from "@/lib/products";
import { getServerI18n } from "@/i18n/server";
import { getUserFromCookie } from "@/lib/auth";
import JsonLd from "@/components/JsonLd";
import HeroRotatingTitle from "@/components/HeroRotatingTitle";
import CaseStudyShowcase from "@/components/landing/CaseStudyShowcase";
import FounderTrust from "@/components/landing/FounderTrust";

const homeMetadata = {
  de: {
    title: "PageFoundry | Landingpages, Hosting & SEO für Unternehmen",
    description:
      "PageFoundry entwickelt Landingpages und übernimmt Hosting, SEO, Speed-Optimierung und technische Betreuung – persönlich und transparent.",
    openGraphDescription:
      "Landingpages, Hosting, SEO und technische Betreuung aus einer Hand – mit echten Projekten und transparenten Preisen.",
    locale: "de_DE",
    alternateLocale: "en_US",
  },
  en: {
    title: "PageFoundry | Landing Pages, Hosting & SEO for Businesses",
    description:
      "PageFoundry builds landing pages and handles hosting, SEO, speed optimization, and ongoing technical care – personally and transparently.",
    openGraphDescription:
      "Landing pages, hosting, SEO, and technical care from one accountable partner – backed by real client work and transparent prices.",
    locale: "en_US",
    alternateLocale: "de_DE",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getServerI18n();
  const current = homeMetadata[lang];

  return {
    title: { absolute: current.title },
    description: current.description,
    alternates: {
      canonical: "https://pagefoundry.de",
      languages: {
        de: "https://pagefoundry.de",
        en: "https://pagefoundry.de",
        "x-default": "https://pagefoundry.de",
      },
    },
    openGraph: {
      title: current.title,
      description: current.openGraphDescription,
      url: "https://pagefoundry.de",
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
    "@type": "ProfessionalService",
    name: "PageFoundry",
    url: "https://pagefoundry.de",
    description: isDe
      ? "Webstudio für Landingpages, Hosting, SEO und laufende technische Betreuung."
      : "Web studio for landing pages, hosting, SEO, and ongoing technical care.",
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
    areaServed: { "@type": "Country", name: "Germany" },
    availableLanguage: ["German", "English"],
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
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Landing Page",
            description: isDe
              ? "Moderne Landingpage mit klarer Struktur und direkter Handlungsführung."
              : "Modern landing page with clear structure and a direct path to action.",
          },
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "590",
            priceCurrency: "EUR",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "SEO Basic",
            description: isDe
              ? "Technische und inhaltliche Optimierung für bessere Sichtbarkeit in Suchmaschinen."
              : "Technical and content optimization for stronger search visibility.",
          },
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "149",
            priceCurrency: "EUR",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "SEO Advanced",
            description: isDe
              ? "Vertiefte SEO-Analyse, Suchstrategie und langfristige Optimierung."
              : "Advanced SEO analysis, search strategy, and long-term optimization.",
          },
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "299",
            priceCurrency: "EUR",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Speed Optimization",
            description: isDe
              ? "Core Web Vitals und Ladewege für eine schnellere Nutzung verbessern."
              : "Improve Core Web Vitals and loading paths for a faster experience.",
          },
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "299",
            priceCurrency: "EUR",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "All-Inclusive Package",
            description: isDe
              ? "Landingpage, Domain, Basic SEO, Google-Indexierung und 12 Monate Hosting."
              : "Landing page, domain, basic SEO, Google indexing, and 12 months of hosting.",
          },
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "790",
            priceCurrency: "EUR",
          },
        },
      ],
    },
  };
}

const copy = {
  de: {
    eyebrow: "01 - Creative Digital Studio",
    subline:
      "Wir verbinden klare Conversion-Strategie, sauberen Code und laufende technische Betreuung. Ohne Baukasten. Ohne aufgeblasenen Agenturprozess.",
    proof: ["Landingpages", "Hosting", "SEO", "Speed", "Wartung", "Checkout"],
    heroPhrases: [
      "Landingpages, die verkaufen.",
      "SEO, das gefunden wird.",
      "Hosting, das einfach läuft.",
      "Speed, der spürbar ist.",
    ],
    workLabel: "02 - Ausgewählte Arbeiten",
    workHeading: "Nicht behauptet. Live.",
    workText:
      "Zwei Unternehmen, zwei unterschiedliche Aufgaben und ein gemeinsamer Anspruch: Die Website muss im echten Betrieb funktionieren.",
    caseLabels: {
      caseFile: "Projektakte",
      problem: "Ausgangslage",
      delivery: "Umgesetzt",
      result: "Ergebnis",
      visit: "Live-Website öffnen",
      liveProject: "Live-Projekt",
    },
    cases: [
      {
        client: "Carbon Care",
        date: "Februar 2026",
        domain: "carbon-care.de",
        url: "https://carbon-care.de",
        image: "/work/carbon-care.jpg",
        imageAlt: "Startseite von Carbon Care mit dem Angebot zur Premium-Fahrzeugaufbereitung",
        scope: "Landingpage · Rechnungssoftware",
        headline: "Vom Neustart zur funktionierenden digitalen Basis.",
        problem:
          "Ein neu gegründetes Unternehmen ohne Website und ohne wiederholbaren digitalen Ablauf für die Rechnungsstellung.",
        delivery:
          "Eine fokussierte Landingpage für die Kundengewinnung und eine maßgeschneiderte Rechnungsanwendung für den täglichen Betrieb.",
        result:
          "Carbon Care erreichte bereits in den ersten Wochen eine zweistellige Zahl an 5-Sterne-Bewertungen bei Google.",
      },
      {
        client: "The Loft",
        date: "Mai / Juni 2026",
        domain: "theloftbrunch.de",
        url: "https://theloftbrunch.de",
        image: "/work/the-loft.jpg",
        imageAlt: "Startseite von The Loft Brunch and Lunch in Wuppertal",
        scope: "Website-Relaunch · Gastronomie",
        headline: "Eine Website, die sich so hochwertig anfühlt wie der Ort.",
        problem:
          "Die bestehende Website transportierte weder die Atmosphäre des Restaurants noch die wichtigsten Informationen mit ausreichender Klarheit.",
        delivery:
          "Ein visueller Relaunch mit bewussterem Spacing, stärkerer Hierarchie, direktem Speisekarten-Zugang und klarer mobiler Führung.",
        result:
          "Die Live-Seite führt jetzt mit Atmosphäre, Speisekarte und genau den Informationen, die Gäste vor einem Besuch benötigen.",
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
      phoneLabel: "Direkter Kontakt",
      emailLabel: "E-Mail",
    },
    servicesLabel: "03 - Leistungen",
    servicesHeading: "Eine Website ist kein Deko-Objekt.",
    servicesText:
      "PageFoundry baut Seiten, die verständlich positionieren, schnell laden und technisch so sauber stehen, dass Marketing nicht an der Infrastruktur scheitert.",
    painLabel: "Das Problem",
    painHeading: "Was kostet eine schlechte Website wirklich?",
    painCta: "Kostenlose Analyse",
    packagesLabel: "04 - Pakete",
    packagesHeading: "Fairer Preis. Volle Leistung.",
    packagesText:
      "Wähle ein Paket als Ausgangspunkt. Den genauen Umfang, Zeitplan und die nächsten Schritte klären wir transparent in der kostenlosen Erstberatung.",
    offerPathsLabel: "Der passende Einstieg",
    offerPaths: [
      {
        key: "Build",
        title: "Etwas Neues bauen.",
        text: "Für Unternehmen, die eine fokussierte Landingpage oder einen vollständigen digitalen Startpunkt benötigen.",
        cta: "Website starten",
        href: "/consultation?package=landing_page",
      },
      {
        key: "Improve",
        title: "Bestehendes besser machen.",
        text: "Für Websites, deren Positionierung, mobile Wirkung, SEO oder Geschwindigkeit nicht mehr ausreichen.",
        cta: "Website verbessern",
        href: "/website-rettung",
      },
      {
        key: "Care",
        title: "Den Betrieb absichern.",
        text: "Für Hosting, Monitoring, Updates und eine feste technische Verantwortung nach dem Launch.",
        cta: "Betreuung ansehen",
        href: "/website-wache",
      },
    ],
    allServicesHeading: "Alle Leistungen und Preise",
    allServicesText: "Transparente Einstiegspreise für klar umrissene Leistungen. Individuelle Kombinationen klären wir vorab.",
    processLabel: "05 - Prozess",
    processHeading: "So arbeiten wir.",
    faqLabel: "06 - FAQ",
    faqHeading: "Häufige Fragen.",
    nextLabel: "Nächster Schritt",
    nextHeading: "Bereit für eine Website die wirkt?",
    nextText:
      "In der kostenlosen Erstberatung priorisieren wir die Seiten und Hebel mit der größten Wirkung - ohne Verkaufsgespräch.",
    consultationCta: "Kostenlose Beratung buchen",
    packagesCta: "Pakete ansehen",
    detailLabel: "Im Detail",
    services: [
      {
        n: "01",
        title: "Landingpages",
        text: "Klarer Aufbau, starke erste Sekunde, eindeutiger CTA und saubere mobile Umsetzung.",
      },
      {
        n: "02",
        title: "SEO & Snippets",
        text: "Titles, Descriptions, Suchintention, interne Verlinkung und Seitenstruktur aus einem Guss.",
      },
      {
        n: "03",
        title: "Hosting & Wartung",
        text: "Deployment, Updates, Backups, Performance und technische Betreuung bleiben geklärt.",
      },
      {
        n: "04",
        title: "Speed-Optimierung",
        text: "Core Web Vitals, Asset-Größe, Ladepfade und technische Reibung werden gezielt reduziert.",
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
        title: "Brief & Ziel",
        text: "Wir klären Zielgruppe, Angebot, Positionierung und Hauptaktion.",
      },
      {
        title: "Struktur & Messaging",
        text: "Dann definieren wir Conversion-Logik, Seitenarchitektur und Copy-Richtung.",
      },
      {
        title: "Build & Launch",
        text: "Wir bauen, optimieren und veröffentlichen schnell, sauber und nachvollziehbar.",
      },
      {
        title: "Laufend optimieren",
        text: "Auf Wunsch: Wartung, SEO, Hosting und laufende Verbesserungen aus einer Hand.",
      },
    ],
    faq: [
      {
        q: "Was kostet eine professionelle Website?",
        a: "Eine Landingpage startet aktuell ab 590 Euro. Erweiterte Pakete, SEO, Hosting, Wartung und individuelle Angebote laufen über die bestehenden Produkt- und Checkout-Flows.",
      },
      {
        q: "Warum gibt es Impressionen, aber keine Klicks?",
        a: "Meist passen Snippet, Suchintention und Seiteninhalt nicht sauber zusammen. Dann erscheint die Website zwar in Google, überzeugt aber nicht zum Klick.",
      },
      {
        q: "Baut ihr nur neue Seiten oder optimiert ihr auch bestehende?",
        a: "Beides. Wenn bestehende Seiten brauchbar sind, optimieren wir gezielt. Wo wichtige Suchintentionen fehlen, ergänzen wir neue Landingpages.",
      },
      {
        q: "Kombiniert ihr SEO mit Hosting und Technik?",
        a: "Ja. Technische Schwächen, Performance und unklare Seitenstruktur wirken direkt auf Rankings, Klickrate und Conversion.",
      },
    ],
  },
  en: {
    eyebrow: "01 - Creative Digital Studio",
    subline:
      "We combine conversion strategy, clean code, and ongoing technical care. No page builder. No bloated agency process.",
    proof: ["Landing pages", "Hosting", "SEO", "Speed", "Maintenance", "Checkout"],
    heroPhrases: [
      "Landing pages that sell.",
      "SEO that gets found.",
      "Hosting that just works.",
      "Speed users can feel.",
    ],
    workLabel: "02 - Selected work",
    workHeading: "Not claimed. Live.",
    workText:
      "Two businesses, two different challenges, and one shared standard: the website has to work in the real world.",
    caseLabels: {
      caseFile: "Case file",
      problem: "Starting point",
      delivery: "Delivered",
      result: "Result",
      visit: "Visit live website",
      liveProject: "Live project",
    },
    cases: [
      {
        client: "Carbon Care",
        date: "February 2026",
        domain: "carbon-care.de",
        url: "https://carbon-care.de",
        image: "/work/carbon-care.jpg",
        imageAlt: "Carbon Care homepage presenting its premium vehicle detailing service",
        scope: "Landing page · Invoicing software",
        headline: "From a new business to a working digital base.",
        problem:
          "A newly founded business without a website or a repeatable digital workflow for creating invoices.",
        delivery:
          "A focused landing page for customer acquisition and a tailored invoicing application for daily operations.",
        result:
          "Carbon Care reached a double-digit number of 5-star Google reviews within its first weeks.",
      },
      {
        client: "The Loft",
        date: "May / June 2026",
        domain: "theloftbrunch.de",
        url: "https://theloftbrunch.de",
        image: "/work/the-loft.jpg",
        imageAlt: "The Loft Brunch and Lunch homepage in Wuppertal",
        scope: "Website relaunch · Hospitality",
        headline: "A website that feels as premium as the place.",
        problem:
          "The existing website did not communicate the restaurant's atmosphere or make essential visitor information clear enough.",
        delivery:
          "A visual relaunch with more deliberate spacing, stronger hierarchy, direct menu access, and clearer mobile guidance.",
        result:
          "The live site now leads with atmosphere, menu access, and the information guests need before they visit.",
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
      phoneLabel: "Direct contact",
      emailLabel: "Email",
    },
    servicesLabel: "03 - Services",
    servicesHeading: "A website is not decoration.",
    servicesText:
      "PageFoundry builds sites that position clearly, load fast, and keep the technical base clean enough for marketing to work.",
    painLabel: "The problem",
    painHeading: "What does a weak website really cost?",
    painCta: "Free analysis",
    packagesLabel: "04 - Packages",
    packagesHeading: "Fair price. Full delivery.",
    packagesText:
      "Choose a package as a starting point. We clarify the exact scope, timeline, and next steps transparently in the free consultation.",
    offerPathsLabel: "Choose your starting point",
    offerPaths: [
      {
        key: "Build",
        title: "Build something new.",
        text: "For businesses that need a focused landing page or a complete digital starting point.",
        cta: "Start a website",
        href: "/consultation?package=landing_page",
      },
      {
        key: "Improve",
        title: "Make the current site work harder.",
        text: "For websites whose positioning, mobile experience, SEO, or speed no longer does enough.",
        cta: "Improve a website",
        href: "/website-rettung",
      },
      {
        key: "Care",
        title: "Keep it running.",
        text: "For hosting, monitoring, updates, and clear technical ownership after launch.",
        cta: "Explore ongoing care",
        href: "/website-wache",
      },
    ],
    allServicesHeading: "All services and prices",
    allServicesText: "Transparent starting prices for clearly scoped work. We clarify custom combinations before anything begins.",
    processLabel: "05 - Process",
    processHeading: "How we work.",
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
        title: "Landing pages",
        text: "Clear structure, strong first impression, direct CTA, and polished mobile execution.",
      },
      {
        n: "02",
        title: "SEO & snippets",
        text: "Titles, descriptions, search intent, internal links, and page structure aligned.",
      },
      {
        n: "03",
        title: "Hosting & care",
        text: "Deployment, updates, backups, performance, and technical ownership stay covered.",
      },
      {
        n: "04",
        title: "Speed optimization",
        text: "Core Web Vitals, asset weight, loading paths, and technical friction are reduced.",
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
        title: "Brief & goal",
        text: "We clarify audience, offer, positioning, and the primary action.",
      },
      {
        title: "Structure & messaging",
        text: "Then we define conversion logic, page architecture, and copy direction.",
      },
      {
        title: "Build & launch",
        text: "We build, optimize, and publish quickly, cleanly, and transparently.",
      },
      {
        title: "Ongoing optimization",
        text: "Optional: maintenance, SEO, hosting, and continuous improvements from one place.",
      },
    ],
    faq: [
      {
        q: "What does a professional website cost?",
        a: "A landing page currently starts at 590 euro. Extended packages, SEO, hosting, maintenance, and custom offers run through the existing product and checkout flows.",
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
        a: "Yes. Technical issues, performance, and unclear structure directly affect rankings, click-through rate, and conversion.",
      },
    ],
  },
} as const;

export default async function LandingPage() {
  const { lang, t } = await getServerI18n();
  const isAuthed = !!(await getUserFromCookie());
  const c = copy[lang];

  return (
    <div className="relative z-10 text-pfText">
      <JsonLd data={getOrganizationSchema(lang)} />

      <section className="relative min-h-[92vh] overflow-hidden px-6 pb-20 pt-32 md:px-10 md:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfAccentDim md:h-[42rem] md:w-[42rem]" />

        <div className="mx-auto grid max-w-screen-xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="fade-in">
            <span className="label-mono mb-8 block">{c.eyebrow}</span>
            <h1
              className="font-display leading-[0.86] tracking-wide text-pfText"
              style={{ fontSize: "clamp(5rem, 15vw, 12rem)" }}
            >
              PAGE
              <br />
              FOUNDRY
            </h1>
            <div className="my-8 h-px w-28 bg-gradient-to-r from-pfAccent to-transparent" />
            <h2
              className="max-w-3xl font-display leading-none text-pfText"
              style={{ fontSize: "clamp(2rem, 5vw, 4.6rem)" }}
            >
              <HeroRotatingTitle phrases={c.heroPhrases} />
            </h2>
          </div>

          <div className="fade-in-delay-2 max-w-xl lg:pb-4">
            <p className="mb-8 text-base leading-8 text-pfSubtle md:text-lg">{c.subline}</p>
            <div className="mb-10 flex flex-wrap gap-2">
              {c.proof.map((item) => (
                <span
                  key={item}
                  className="border border-pfBorder bg-pfCard px-3 py-2 font-mono text-[0.62rem] uppercase tracking-widest text-pfMuted"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/consultation" className="btn-accent">
                {t("hero.ctaFree")} →
              </Link>
              <Link href="#packages" className="btn-outline">
                {t("hero.ctaSee")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-pfBorder bg-pfSurface/70 py-4">
        <div className="flex w-max animate-[marquee_32s_linear_infinite] gap-8 whitespace-nowrap font-mono text-[0.65rem] uppercase tracking-[0.22em] text-pfMuted">
          {[...c.proof, ...c.proof, ...c.proof].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-8">
              {item}
              <span className="text-pfAccent">/</span>
            </span>
          ))}
        </div>
      </section>

      <section className="border-b border-pfBorder bg-pfSurface/40 px-6 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <span className="label-mono mb-5 block">{c.workLabel}</span>
              <h2 className="font-display text-6xl leading-none text-pfText md:text-8xl">{c.workHeading}</h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-pfSubtle lg:justify-self-end md:text-lg">{c.workText}</p>
          </div>

          <CaseStudyShowcase cases={c.cases} labels={c.caseLabels} />
        </div>
      </section>

      <FounderTrust copy={c.founder} />

      <section className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-12 max-w-2xl">
            <span className="label-mono mb-5 block">{c.servicesLabel}</span>
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {c.servicesHeading}
            </h2>
            <p className="mt-6 text-base leading-8 text-pfSubtle">{c.servicesText}</p>
          </div>

          <div className="grid overflow-hidden rounded-3xl border border-pfBorder bg-pfBorder sm:grid-cols-2">
            {c.services.map((service) => (
              <article key={service.n} className="min-h-64 bg-pfCard p-8 transition-colors hover:bg-pfCardHover">
                <span className="font-mono text-[0.62rem] tracking-widest text-pfAccent">{service.n}</span>
                <h3 className="mt-12 font-display text-4xl leading-none text-pfText">{service.title}</h3>
                <p className="mt-4 text-sm leading-7 text-pfSubtle">{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-screen-xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="label-mono mb-5 block">{c.painLabel}</span>
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {c.painHeading}
            </h2>
            <Link href="/consultation" className="btn-accent mt-10">
              {c.painCta} →
            </Link>
          </div>

          <div>
            {c.pain.map((item, index) => (
              <div key={item} className="flex gap-5 border-b border-pfBorder py-5 last:border-b-0">
                <span className="mt-1 shrink-0 font-mono text-[0.62rem] tracking-widest text-pfAccent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-7 text-pfSubtle md:text-base">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="bg-pfSurface px-6 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-12 max-w-2xl">
            <span className="label-mono mb-5 block">{c.packagesLabel}</span>
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {c.packagesHeading}
            </h2>
            <p className="mt-6 text-base leading-8 text-pfSubtle">{c.packagesText}</p>
          </div>

          <span className="label-mono mb-5 block">{c.offerPathsLabel}</span>
          <div className="mb-20 grid gap-px overflow-hidden border border-pfBorder bg-pfBorder lg:grid-cols-3">
            {c.offerPaths.map((path) => (
              <Link
                key={path.key}
                href={path.href}
                className="group flex min-h-72 flex-col bg-pfCard p-8 transition-colors hover:bg-pfCardHover md:p-10"
              >
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-pfAccent">{path.key}</span>
                <h3 className="mt-8 font-display text-4xl leading-none text-pfText md:text-5xl">{path.title}</h3>
                <p className="mt-5 flex-1 text-sm leading-7 text-pfSubtle">{path.text}</p>
                <span className="mt-8 inline-flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-pfText transition-colors group-hover:text-pfAccent">
                  {path.cta} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mb-8 border-t border-pfBorder pt-10">
            <h3 className="font-display text-4xl leading-none text-pfText md:text-5xl">{c.allServicesHeading}</h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-pfSubtle">{c.allServicesText}</p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-3xl bg-pfBorder sm:grid-cols-2 lg:grid-cols-3">
            {productOrderKeys.map((id) => (
              <div key={id} className="bg-pfSurface">
                <PackageCard id={id} isAuthed={isAuthed} />
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-pfBorder pt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="font-mono text-[0.7rem] uppercase tracking-widest text-pfMuted">
              {c.detailLabel}
            </span>
            <Link href="/ki-telefonassistenz" className="btn-outline">
              KI-Telefonassistenz
            </Link>
            <Link href="/website-wache" className="btn-outline">
              Website-Wache
            </Link>
            <Link href="/website-rettung" className="btn-outline">
              Website-Rettung
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-12">
            <span className="label-mono mb-5 block">{c.processLabel}</span>
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {c.processHeading}
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-3xl bg-pfBorder sm:grid-cols-2 lg:grid-cols-4">
            {c.process.map((step, index) => (
              <article key={step.title} className="min-h-64 bg-pfCard p-8">
                <div className="font-display text-7xl leading-none text-pfAccent opacity-60">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-8 font-display text-3xl leading-none text-pfText">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-pfSubtle">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-pfSurface px-6 py-24 md:px-10">
        <div className="mx-auto max-w-3xl">
          <span className="label-mono mb-5 block">{c.faqLabel}</span>
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

      <section className="relative overflow-hidden px-6 py-32 text-center md:px-10">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfAccentDim md:h-[38rem] md:w-[38rem]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfBorderAccent md:h-[26rem] md:w-[26rem]" />

        <div className="relative mx-auto max-w-4xl">
          <span className="label-mono mb-8 block">{c.nextLabel}</span>
          <h2
            className="font-display leading-[0.9] text-pfText"
            style={{ fontSize: "clamp(4rem, 10vw, 8rem)" }}
          >
            {c.nextHeading}
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-pfSubtle">{c.nextText}</p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/consultation" className="btn-accent">
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
