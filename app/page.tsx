import type { Metadata } from "next";
import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import { productOrderKeys } from "@/lib/products";
import { getServerI18n } from "@/i18n/server";
import { getUserFromCookie } from "@/lib/auth";
import JsonLd from "@/components/JsonLd";
import HeroRotatingTitle from "@/components/HeroRotatingTitle";

export const metadata: Metadata = {
  title: "PageFoundry | Landing Pages, Hosting & SEO für Unternehmen",
  description:
    "PageFoundry baut hochkonvertierende Landing Pages, übernimmt Hosting, SEO-Optimierung und Speed-Tuning. Transparent. Ohne Retainer-Bullshit.",
  alternates: {
    canonical: "https://pagefoundry.de",
    languages: {
      de: "https://pagefoundry.de",
      en: "https://pagefoundry.de",
    },
  },
  openGraph: {
    title: "PageFoundry | Landing Pages, Hosting & SEO",
    description:
      "Hochkonvertierende Landing Pages, Hosting, SEO & Speed-Optimierung. Klar kalkuliert, keine Retainer.",
    url: "https://pagefoundry.de",
    siteName: "PageFoundry",
    locale: "de_DE",
    type: "website",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "PageFoundry",
  url: "https://pagefoundry.de",
  description:
    "Web-Agentur für hochkonvertierende Landing Pages, Hosting, SEO und Speed-Optimierung.",
  areaServed: { "@type": "Country", name: "Germany" },
  availableLanguage: ["German", "English"],
  priceRange: "€€",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: ["German", "English"],
    url: "https://pagefoundry.de/consultation",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Web Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Landing Page",
          description:
            "Hochperformante, moderne Landing Page optimiert für maximale Conversion.",
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          price: "499",
          priceCurrency: "EUR",
          minPrice: "499",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "SEO Basic",
          description:
            "Technische und inhaltliche Optimierung für bessere Sichtbarkeit in Suchmaschinen.",
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          price: "199",
          priceCurrency: "EUR",
          minPrice: "199",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "SEO Advanced",
          description:
            "Tiefe SEO-Analyse, Keyword-Strategie und langfristige Performance-Optimierung.",
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          price: "499",
          priceCurrency: "EUR",
          minPrice: "499",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Speed Optimization",
          description:
            "Core Web Vitals verbessern für bessere Google Rankings und User Experience.",
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          price: "149",
          priceCurrency: "EUR",
          minPrice: "149",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "All-Inclusive Package",
          description:
            "Landing Page, Hosting, Domain, Basic SEO & Google-Indexierung - alles inklusive.",
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          price: "799",
          priceCurrency: "EUR",
          minPrice: "799",
        },
      },
    ],
  },
};

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
    servicesLabel: "02 - Leistungen",
    servicesHeading: "Eine Website ist kein Deko-Objekt.",
    servicesText:
      "PageFoundry baut Seiten, die verständlich positionieren, schnell laden und technisch so sauber stehen, dass Marketing nicht an der Infrastruktur scheitert.",
    painLabel: "Das Problem",
    painHeading: "Was kostet eine schlechte Website wirklich?",
    painCta: "Kostenlose Analyse",
    packagesLabel: "03 - Pakete",
    packagesHeading: "Fairer Preis. Volle Leistung.",
    packagesText:
      "Die Karten bleiben an die echte Produktlogik angebunden: Login, Checkout, Beratung und spätere Bestellungen laufen unverändert weiter.",
    processLabel: "04 - Prozess",
    processHeading: "So arbeiten wir.",
    faqLabel: "05 - FAQ",
    faqHeading: "Häufige Fragen.",
    nextLabel: "Nächster Schritt",
    nextHeading: "Bereit für eine Website die wirkt?",
    nextText:
      "In der kostenlosen Erstberatung priorisieren wir die Seiten und Hebel mit der größten Wirkung - ohne Verkaufsgespräch.",
    consultationCta: "Kostenlose Beratung buchen",
    packagesCta: "Pakete ansehen",
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
        a: "Eine Landingpage startet aktuell ab 499 Euro. Erweiterte Pakete, SEO, Hosting, Wartung und individuelle Angebote laufen über die bestehenden Produkt- und Checkout-Flows.",
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
    servicesLabel: "02 - Services",
    servicesHeading: "A website is not decoration.",
    servicesText:
      "PageFoundry builds sites that position clearly, load fast, and keep the technical base clean enough for marketing to work.",
    painLabel: "The problem",
    painHeading: "What does a weak website really cost?",
    painCta: "Free analysis",
    packagesLabel: "03 - Packages",
    packagesHeading: "Fair price. Full delivery.",
    packagesText:
      "The cards remain connected to the real product logic: login, checkout, consultation, and later orders keep working unchanged.",
    processLabel: "04 - Process",
    processHeading: "How we work.",
    faqLabel: "05 - FAQ",
    faqHeading: "Common questions.",
    nextLabel: "Next step",
    nextHeading: "Ready for a website that works?",
    nextText:
      "In the free consultation, we prioritize the pages and levers with the biggest impact - without a sales call.",
    consultationCta: "Book free consultation",
    packagesCta: "See packages",
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
        a: "A landing page currently starts at 499 euro. Extended packages, SEO, hosting, maintenance, and custom offers run through the existing product and checkout flows.",
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
      <JsonLd data={organizationSchema} />

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

          <div className="grid gap-px overflow-hidden rounded-3xl bg-pfBorder sm:grid-cols-2 lg:grid-cols-3">
            {productOrderKeys.map((id) => (
              <div key={id} className="bg-pfSurface">
                <PackageCard id={id} isAuthed={isAuthed} />
              </div>
            ))}
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
                <div className="font-display text-7xl leading-none text-pfAccentDim">
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
