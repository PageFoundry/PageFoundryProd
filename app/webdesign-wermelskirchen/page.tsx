import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { regionalPricing, regionalReferences } from "@/lib/seo/regionalWebdesign";

const TITLE = "Webdesign Wermelskirchen";
const DESCRIPTION = "Webdesign für Wermelskirchen: Leistungen, Einsatzgebiet und Anfragen klar strukturieren. PageFoundry aus Hückeswagen, Vor-Ort-Termin nach Absprache. Ab 590 €.";
const PATH = "/webdesign-wermelskirchen";

export const metadata = createPageMetadata({ path: PATH, title: TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  pricing: regionalPricing,
  references: regionalReferences,
  "eyebrow": "Webdesign · Wermelskirchen",
  "heroHeading": "Webdesign für Wermelskirchen, das Ihre Leistungen verständlich erklärt.",
  "heroSubline": "Ein Handwerksauftrag beginnt mit anderen Fragen als eine technische Dienstleistung. Deshalb starten wir bei Ihrem Betrieb: Welche Arbeiten übernehmen Sie, welche Informationen brauchen Interessenten und wie soll eine Anfrage ankommen? Von Hückeswagen aus setzt Fabian Franke Ihre Website um und bleibt auch nach dem Start Ansprechpartner.",
  "problem": {
    "label": "Ihre Ausgangslage",
    "heading": "Gute Anfragen brauchen klare Grenzen.",
    "points": [
      "Wenn alle Leistungen in einem langen Text stehen, erkennen Besucher kaum, wofür Ihr Betrieb der passende Ansprechpartner ist. Wir ordnen das Angebot nach konkreten Aufgaben.",
      "Bei Handwerk und Service müssen Einsatzgebiet und Kontaktweg zusammenpassen. Besucher sollen erkennen, ob Sie zu ihnen kommen oder ein Besuch bei Ihnen sinnvoll ist.",
      "Für technische Dienstleistungen reicht ein Werbesatz oft nicht. Arbeitsbeispiele, Voraussetzungen und ein verständlicher Ablauf helfen bei der ersten Einschätzung."
    ]
  },
  "steps": {
    "label": "Zusammenarbeit",
    "heading": "Vom Leistungsumfang zur passenden Anfrage.",
    "items": [
      {
        "title": "Leistungen abgrenzen",
        "text": "Wir besprechen typische Aufträge, Ihr Einsatzgebiet und Leistungen, die Sie ausdrücklich nicht anbieten. Daraus entsteht der Inhaltsplan."
      },
      {
        "title": "Anfrageweg festlegen",
        "text": "Wir legen fest, welche Angaben Sie für eine erste Einschätzung brauchen. Ein Formular oder direkter Anruf wird passend zum Projekt vereinbart."
      },
      {
        "title": "Veröffentlichung begleiten",
        "text": "Sie prüfen Inhalte und Gestaltung. Wir testen die Website auf dem Smartphone und klären, wer spätere Änderungen übernimmt."
      }
    ]
  },
  "included": {
    "label": "Vereinbarter Umfang",
    "heading": "Informationen, die vor einem Auftrag helfen.",
    "items": [
      "Übersicht Ihrer Leistungen mit nachvollziehbaren Grenzen",
      "Einsatzgebiet und Besuchsmöglichkeiten verständlich dargestellt",
      "Abgestimmter Kontaktweg statt beliebiger Formularfelder",
      "Technische Umsetzung und Einweisung für die vereinbarte Website"
    ],
    "note": "Texte, Bilder, Seitenumfang und spätere Betreuung werden im Angebot festgelegt. Wir versprechen weder bestimmte Google-Platzierungen noch feste Anfragezahlen."
  },
  "faq": {
    "label": "Fragen zur Zusammenarbeit",
    "heading": "Webdesign in Wermelskirchen: konkret besprochen.",
    "items": [
      {
        "q": "Sind persönliche Besprechungen in Wermelskirchen möglich?",
        "a": "Ja, nach Absprache kommen wir in Ihren Betrieb. Hückeswagen ist über die Landesstraßen L 68 und L 101 in Richtung Wermelskirchen angebunden. Für Zwischenstände nutzen wir Telefon oder Video. Unser Firmensitz bleibt Hückeswagen; ein Büro in Wermelskirchen gibt es nicht."
      },
      {
        "q": "Können mehrere Fachbereiche auf die Website?",
        "a": "Ja. Ob eine gegliederte Landingpage genügt oder eigene Unterseiten sinnvoll sind, hängt vom Umfang und den Zielgruppen ab. Mehrere Unterseiten sind nicht pauschal im Landingpage-Einstiegspreis enthalten und werden separat angeboten."
      },
      {
        "q": "Kann die Website später um ein internes Werkzeug ergänzt werden?",
        "a": "Das ist nach Prüfung möglich und ein eigener Auftrag. Carbon Care zeigt die Trennung: eine öffentliche Landingpage und unabhängig davon eine Rechnungssoftware. So muss eine Website nicht alle betrieblichen Abläufe zugleich lösen."
      }
    ]
  },
  "cta": {
    "heading": "Welche Aufträge möchten Sie über Ihre Website erhalten?",
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
        areaServed: { "@type": "City", name: "Wermelskirchen" },
      }} />
      <ServiceLanding data={data} />
    </>
  );
}
