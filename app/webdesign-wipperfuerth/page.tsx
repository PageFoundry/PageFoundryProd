import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { regionalPricing, regionalReferences } from "@/lib/seo/regionalWebdesign";

const TITLE = "Webdesign Wipperfürth";
const DESCRIPTION = "Webdesign für Wipperfürth aus dem benachbarten Hückeswagen: Websites für Handwerk, Handel und Gastronomie. Persönlicher Termin nach Absprache, Landingpage ab 590 €.";
const PATH = "/webdesign-wipperfuerth";

export const metadata = createPageMetadata({ path: PATH, title: TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  pricing: regionalPricing,
  references: regionalReferences,
  "eyebrow": "Webdesign · Wipperfürth",
  "heroHeading": "Webdesign für Wipperfürth: vom ersten Eindruck zur konkreten Anfrage.",
  "heroSubline": "Sie führen einen Handwerksbetrieb, ein Geschäft oder einen Gastronomiebetrieb in Wipperfürth? Ihre Website soll vor dem ersten Anruf zeigen, ob Ihr Angebot passt. PageFoundry entwickelt dafür eine klare Struktur, verständliche Inhalte und einen Kontaktweg, der auch unterwegs funktioniert. Ihr Ansprechpartner ist Fabian Franke aus Hückeswagen.",
  "problem": {
    "label": "Ihre Ausgangslage",
    "heading": "Was möchten Ihre Besucher vor dem Kontakt wissen?",
    "points": [
      "Bei einem Handwerksauftrag zählt, welche Arbeiten Sie übernehmen und wo Sie tätig sind. Eine reine Bildergalerie beantwortet diese Fragen selten.",
      "Im Handel brauchen Interessenten Orientierung zu Sortiment, Standort und Besuchsmöglichkeiten. Eine Website kann diese Informationen bündeln, ohne gleich einen Onlineshop vorauszusetzen.",
      "Für ein Café oder Restaurant stehen Speisekarte und Besuchsinformationen im Vordergrund. Sie sollten auf dem Smartphone ohne Suche erreichbar sein."
    ]
  },
  "steps": {
    "label": "Zusammenarbeit",
    "heading": "Wir planen den Weg vom Angebot zum Kontakt.",
    "items": [
      {
        "title": "Angebot ordnen",
        "text": "Wir klären, welche Leistungen Ihre Website erklären soll und welche Rückfragen Sie vor einem Auftrag regelmäßig beantworten."
      },
      {
        "title": "Inhalte aufbauen",
        "text": "Aus vorhandenen Bildern, Leistungsangaben und Kontaktinformationen entsteht eine Seitenstruktur. Fehlende Inhalte und Zuständigkeiten halten wir vorab fest."
      },
      {
        "title": "Mobil abnehmen",
        "text": "Vor dem Start prüfen wir gemeinsam die Darstellung, Links und Kontaktwege. Texte und Leistungsumfang geben Sie frei."
      }
    ]
  },
  "included": {
    "label": "Vereinbarter Umfang",
    "heading": "Eine Website für Ihren nächsten Schritt.",
    "items": [
      "Klare Leistungsbeschreibung statt einer bloßen digitalen Visitenkarte",
      "Besuchsinformationen oder Einzugsgebiet passend zu Ihrem Betrieb",
      "Direkter Anruf- oder Anfrageweg für mobile Besucher",
      "Individuelle Gestaltung mit Ihren vorhandenen Bildern und Inhalten"
    ],
    "note": "Texte, Bilder, Seitenumfang und spätere Betreuung werden im Angebot festgelegt. Wir versprechen weder bestimmte Google-Platzierungen noch feste Anfragezahlen."
  },
  "faq": {
    "label": "Fragen zur Zusammenarbeit",
    "heading": "Webdesign in Wipperfürth: konkret besprochen.",
    "items": [
      {
        "q": "Wie kommt PageFoundry nach Wipperfürth?",
        "a": "Hückeswagen und Wipperfürth sind über die B 237 verbunden. Für die Besprechung in Ihrem Geschäft oder Betrieb vereinbaren wir auf Wunsch einen persönlichen Termin. PageFoundry hat seinen Sitz in Hückeswagen, keine Niederlassung in Wipperfürth."
      },
      {
        "q": "Muss ich für meinen Laden einen Onlineshop beauftragen?",
        "a": "Nein. Wenn Ihre Kunden vor Ort einkaufen, kann eine fokussierte Seite mit Sortimentsschwerpunkten, Besuchsinformationen und Kontakt ausreichen. Onlinebestellungen wären ein eigener, gesondert kalkulierter Umfang."
      },
      {
        "q": "Welches Projekt zeigt einen ähnlichen Kontaktweg?",
        "a": "Die Landingpage für Carbon Care stellt Fahrzeugaufbereitung und den direkten Kontakt in den Mittelpunkt. The Loft zeigt, wie eine Gastronomie-Website Besuchsinformationen und Speisekarte zugänglich macht. Beide Projektseiten sind unten verlinkt; sie sind keine behaupteten Referenzen aus Wipperfürth."
      }
    ]
  },
  "cta": {
    "heading": "Welche Fragen soll Ihre Website vor dem ersten Anruf beantworten?",
    "text": "In der kostenlosen Erstberatung klären wir Ausgangslage, Ziele und den nächsten sinnvollen Schritt. Ein persönlicher Termin vor Ort wird individuell vereinbart."
  },
  "related": {
    "label": "Weitere Leistungen aus Hückeswagen",
    "items": [
      {
        "label": "Webdesign im Bergischen Land",
        "href": "/webdesign-bergisches-land"
      },
      {
        "label": "Individuelle Software",
        "href": "/individuelle-software"
      },
      {
        "label": "SEO aus Hückeswagen",
        "href": "/seo-hueckeswagen"
      }
    ]
  }
};

export default function RegionalWebdesignPage() {
  return (
    <>
      <JsonLd data={{
        ...getServiceSchema({ name: TITLE, description: DESCRIPTION, url: `https://pagefoundry.de${PATH}` }),
        areaServed: { "@type": "City", name: "Wipperfürth" },
      }} />
      <ServiceLanding data={data} />
    </>
  );
}
