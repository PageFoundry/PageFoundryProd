import type { ServiceLandingData } from "@/components/landing/ServiceLanding";
import { websiteStages, formatEuro, websiteTermsDe, taxNoteDe } from "@/lib/websitePricing";

export const regionalPricing: ServiceLandingData["pricing"] = {
  label: "Preise",
  heading: "Drei Stufen. Kauf oder Betreuung.",
  tiers: websiteStages.map((stage) => ({
    name: stage.name + " — " + stage.de,
    price: formatEuro(stage.purchase),
    priceNote: "Kauf, einmalig",
    highlight: stage.id === "gefunden",
    features: [stage.scope, `Betreut (nur Unternehmen): ${formatEuro(stage.setup)} Einrichtung + ${formatEuro(stage.monthly)}/Monat, 24 Monate`, `${stage.changes} pro Monat; ab Monat 25 ${formatEuro(stage.later)}/Monat (${stage.laterChanges})`],
  })),
  footnote: `${taxNoteDe} Alle Stufen: mobil, Kontakt/WhatsApp/Anruf, Karte, Impressum/Datenschutz eingebunden und Basis-SEO. Google-Unternehmensprofil ab Gefunden. ${websiteTermsDe}`,
};

export const regionalReferences: ServiceLandingData["references"] = {
  heading: "Echte Projekte, nachvollziehbarer Umfang.",
  items: [
    {
      name: "Carbon Care · Fahrzeugaufbereitung",
      text: "Individuelle Rechnungssoftware mit Rechnungen, Status und Zahlungsstand. Die Anwendung läuft im Tagesbetrieb. Die Projektseite zeigt den dokumentierten Umfang mit Beispieldaten.",
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
