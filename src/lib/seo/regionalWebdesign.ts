import type { ServiceLandingData } from "@/components/landing/ServiceLanding";
import { productDisplayInfo } from "@/lib/products";

export const regionalPricing: ServiceLandingData["pricing"] = {
  label: "Bestehende Pakete",
  heading: "Der Umfang bestimmt das passende Angebot.",
  tiers: [
    {
      name: "Landingpage",
      price: productDisplayInfo.landing_page.from.replace("from €", "ab ") + " €",
      priceNote: "einmalig",
      features: ["Eine fokussierte Seite für Ihr Angebot", "Individuelle Gestaltung und mobile Umsetzung", "Klarer Kontakt- oder Anrufweg"],
    },
    {
      name: "All-Inclusive",
      price: productDisplayInfo.all_inclusive.from.replace("from €", "ab ") + " €",
      priceNote: "einmalig",
      highlight: true,
      features: ["Landingpage und Domain", "Basic-SEO und Vorbereitung der Google-Indexierung", "12 Monate Hosting inklusive, danach 19 €/Monat"],
    },
    {
      name: "Hosting",
      price: productDisplayInfo.landing_page_hosting.from.replace("from €", "ab ").replace("/month", " €"),
      priceNote: "pro Monat",
      features: ["Hosting einer bestehenden Landingpage", "Domainverwaltung optional", "Wartung optional ab 79 €/Monat"],
    },
  ],
  footnote: "Alle Preise sind Endpreise nach § 19 UStG, ohne Ausweis von Umsatzsteuer. Beim All-Inclusive-Paket wird die Domainverlängerung separat berechnet. Mehrere Unterseiten, Shops und Schnittstellen kalkulieren wir separat. Google entscheidet über die Indexierung.",
};

export const regionalReferences: ServiceLandingData["references"] = {
  heading: "Echte Projekte, nachvollziehbarer Umfang.",
  items: [
    {
      name: "Carbon Care · Fahrzeugaufbereitung",
      text: "Landingpage und eigenständige Rechnungssoftware mit Rechnungen, Status und Zahlungsstand. Beide Systeme laufen unabhängig voneinander im Tagesbetrieb. Die Projektseite zeigt den dokumentierten Umfang mit Beispieldaten.",
      href: "/projekte/carbon-care",
      label: "Projekt Carbon Care ansehen",
    },
    {
      name: "The Loft · Gastronomie in Wuppertal",
      text: "Relaunch einer WordPress-Website als statische Seite. Atmosphäre, Besuchsinformationen und Zugang zur Speisekarte stehen im Mittelpunkt; ein WordPress-Plugin-Stack wird dafür nicht benötigt.",
      href: "/projekte/the-loft",
      label: "Projekt The Loft ansehen",
    },
  ],
};
