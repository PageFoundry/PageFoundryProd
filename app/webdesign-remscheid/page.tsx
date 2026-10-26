import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { regionalPricing, regionalReferences } from "@/lib/seo/regionalWebdesign";

const TITLE = "Webdesign Remscheid";
const DESCRIPTION = "Webdesign für Remscheid: technische Angebote, Handwerk und Service klar darstellen. Aus Hückeswagen, mit Vor-Ort-Termin nach Absprache. Landingpages ab 790 €.";
const PATH = "/webdesign-remscheid";

export const metadata = createPageMetadata({ path: PATH, title: TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  pricing: regionalPricing,
  references: regionalReferences,
  "eyebrow": "Webdesign · Remscheid",
  "heroHeading": "Webdesign für Remscheid: technische Leistung klar auf den Punkt.",
  "heroSubline": "Für Werkzeugbau, Fertigung, Handwerk oder technische Dienstleistungen muss eine Website mehr leisten als einen guten ersten Eindruck. Sie soll zeigen, welche Aufgaben Ihr Unternehmen übernimmt und wie ein Interessent mit Ihnen ins Gespräch kommt. PageFoundry plant und entwickelt diese Seiten in Hückeswagen, mit Fabian Franke als direktem Ansprechpartner.",
  "problem": {
    "label": "Ihre Ausgangslage",
    "heading": "Fachlich präzise, auch beim ersten Besuch.",
    "points": [
      "Ein Fachbegriff allein erklärt noch nicht, für welche Anwendung Ihre Leistung geeignet ist. Ich verbinde technische Angaben mit verständlichen Einsatzbeispielen aus Ihrem Unternehmen.",
      "Firmenkunden brauchen andere Informationen als private Auftraggeber. Die Website soll diese Wege so ordnen, dass Besucher beim passenden Angebot ankommen.",
      "Ein umfangreicher Produktkatalog oder eine Schnittstelle zum Vertrieb ist ein anderes Vorhaben als eine Landingpage. Diese Grenzen gehören vor der Beauftragung auf den Tisch."
    ]
  },
  "steps": {
    "label": "Zusammenarbeit",
    "heading": "Erst die Anwendung verstehen, dann die Seite bauen.",
    "items": [
      {
        "title": "Zielgruppe klären",
        "text": "Ich bespreche, ob Sie Einkäufer, technische Entscheider oder private Auftraggeber ansprechen und was diese vor einer Anfrage wissen müssen."
      },
      {
        "title": "Belege auswählen",
        "text": "Sie liefern freigegebene Leistungsdaten, Bilder und Arbeitsbeispiele. Ich baue daraus verständliche Inhalte, ohne Zertifikate oder Ergebnisse zu erfinden."
      },
      {
        "title": "Kontakt prüfen",
        "text": "Ich teste Lesbarkeit, mobile Bedienung und den vereinbarten Anfrageweg. Erweiterungen wie Kataloge werden nur im beauftragten Umfang umgesetzt."
      }
    ]
  },
  "included": {
    "label": "Vereinbarter Umfang",
    "heading": "Eine belastbare Grundlage für die erste Kontaktaufnahme.",
    "items": [
      "Struktur für technische Leistungen und deren Einsatzbereiche",
      "Getrennte Ansprache unterschiedlicher Kundengruppen, soweit vereinbart",
      "Freigegebene Arbeitsbeispiele statt unbelegter Qualitätsversprechen",
      "Mobile Umsetzung mit direktem Zugang zum richtigen Ansprechpartner"
    ],
    "note": "Texte, Bilder, Seitenumfang und spätere Betreuung werden im Angebot festgelegt. Ich verspreche weder bestimmte Google-Platzierungen noch feste Anfragezahlen."
  },
  "faq": {
    "label": "Fragen zur Zusammenarbeit",
    "heading": "Webdesign in Remscheid: konkret besprochen.",
    "items": [
      {
        "q": "Wie läuft die Zusammenarbeit in Remscheid ab?",
        "a": "Von Hückeswagen führt die B 237 nach Bergisch Born; von dort besteht Anschluss in Richtung Remscheid. Ein persönlicher Termin in Ihrem Unternehmen ist nach Absprache möglich. Planung und Umsetzung erfolgen in Hückeswagen, nicht in einer Remscheider Niederlassung."
      },
      {
        "q": "Entsteht auch eine Website für einen Industriebetrieb?",
        "a": "Ja, wenn der benötigte Umfang zu einem individuell vereinbarten Webprojekt passt. Sprachen, Produktdaten, Downloads und Anbindungen prüfe ich vorab. Die veröffentlichten Einstiegspakete enthalten keinen vollständigen Industriekatalog und kein Kundenportal."
      },
      {
        "q": "Welche Erfahrung ist öffentlich nachvollziehbar?",
        "a": "Die beiden dokumentierten Projekte sind Carbon Care in der Fahrzeugaufbereitung und The Loft in der Gastronomie. Sie belegen Website- und Softwareumsetzung, aber keine spezialisierte Industriereferenz aus Remscheid. Ob Ihr fachlicher Umfang passt, kläre ich im Erstgespräch."
      }
    ]
  },
  "cta": {
    "heading": "Welches technische Angebot soll Ihre Website erklären?",
    "text": "In der kostenlosen Erstberatung kläre ich Ausgangslage, Ziele und den nächsten sinnvollen Schritt. Ein persönlicher Termin vor Ort wird individuell vereinbart."
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
        areaServed: { "@type": "City", name: "Remscheid" },
      }} />
      <ServiceLanding data={data} />
    </>
  );
}
