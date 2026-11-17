import Image from "next/image";
import Link from "next/link";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { regionalPricing, regionalReferences } from "@/lib/seo/regionalWebdesign";

const TITLE = "Webdesign Remscheid";
const META_TITLE = "Webdesign für Remscheid – Firmenwebsites ab 790 €";
const DESCRIPTION = "Webdesign für Remscheid: technische Angebote, Handwerk und Service klar darstellen. Aus Hückeswagen, mit Vor-Ort-Termin nach Absprache. Landingpages ab 790 €.";
const PATH = "/webdesign-remscheid";

export const metadata = createPageMetadata({ path: PATH, title: META_TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  pricing: regionalPricing,
  references: regionalReferences,
  "eyebrow": "Webdesign · Remscheid",
  "heroHeading": "Webdesign für Handwerk und technische Betriebe in Remscheid",
  "heroSubline": "Welche Arbeiten übernehmen Sie, welche Werkstoffe bearbeiten Sie und wer beantwortet eine Anfrage? Ich baue Firmenwebsites, auf denen Ihre Kunden das schnell herausfinden. Eine einseitige Website kostet ab 790 €. Ich arbeite in Hückeswagen und komme nach Absprache zu Ihnen nach Remscheid.",
  heroNote: (
    <Link href="/projekte/the-loft" className="mt-8 !grid w-full max-w-2xl items-center gap-4 rounded-xl border border-pfBorder p-4 hover:border-pfAccent focus-visible:outline focus-visible:outline-2 focus-visible:outline-pfAccent sm:grid-cols-[13rem_minmax(0,1fr)]">
      <Image
        src="/work/the-loft-desktop.jpg"
        alt="Startseite von The Loft mit dem Button „Speisekarte ansehen“"
        width={1440}
        height={1000}
        sizes="(min-width: 640px) 208px, calc(100vw - 82px)"
        className="h-auto w-full rounded-lg"
      />
      <span>
        Bei The Loft in Wuppertal führt ein Button direkt zur Speisekarte. Auf der Website eines Handwerksbetriebs kann an dieser Stelle die Projektanfrage stehen.
        <span className="mt-2 block text-pfAccent underline underline-offset-4">Website von The Loft im Projektbericht ansehen</span>
      </span>
    </Link>
  ),
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
        "a": "Ich plane und entwickle die Website in Hückeswagen. Inhalte und Zwischenstände besprechen wir per Telefon oder Video. Für ein persönliches Gespräch komme ich nach Absprache zu Ihnen nach Remscheid."
      },
      {
        q: "Betreuen Sie auch Websites, die bereits online sind?",
        a: (
          <>
            Auch bei Ihrem bisherigen Hoster kann ich Erreichbarkeit, SSL und Ladezeit überwachen. Die Pakete für{" "}
            <Link href="/website-wache" className="text-pfAccent underline underline-offset-4">Website-Wartung und Monitoring</Link>{" "}
            zeigen, welche Prüfungen und kleinen Korrekturen enthalten sind.
          </>
        ),
        aText: "Auch bei Ihrem bisherigen Hoster kann ich Erreichbarkeit, SSL und Ladezeit überwachen. Die Pakete für Website-Wartung und Monitoring zeigen, welche Prüfungen und kleinen Korrekturen enthalten sind."
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
