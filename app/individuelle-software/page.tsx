import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Individuelle Software";
const DESCRIPTION =
  "Individuelle Software von PageFoundry aus Hückeswagen: Anwendungen für Rechnungen, Daten und interne Abläufe, zugeschnitten auf Ihren Betrieb — am Beispiel der Carbon-Care-Rechnungssoftware im echten Tagesbetrieb.";
const URL = "https://pagefoundry.de/individuelle-software";

const TAX_NOTE =
  "Alle Angebote werden individuell kalkuliert. PageFoundry ist Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.";

export const metadata = createPageMetadata({
  path: "/individuelle-software",
  title: TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ServiceLandingData = {
  eyebrow: "Individuelle Software",
  heroHeading: "Software, die zu Ihrem Betrieb passt — nicht umgekehrt.",
  heroSubline:
    "Für Rechnungen, Daten und wiederkehrende Abläufe, die heute noch über Listen, Zettel oder unpassende Standardsoftware laufen, bauen wir eine eigene Anwendung: genau auf Ihren Ablauf zugeschnitten, ohne Funktionen, die Sie nie nutzen.",
  problem: {
    label: "Das Problem",
    heading: "Standardsoftware passt selten genau.",
    points: [
      "Excel-Listen und Zettelwirtschaft wachsen mit dem Betrieb mit — bis niemand mehr den Überblick hat.",
      "Fertige Standardlösungen bringen viele Funktionen mit, die Sie nicht brauchen, und passen selten exakt zum eigenen Ablauf.",
      "Für kleine Betriebe rechnen sich große Warenwirtschafts- oder ERP-Systeme meist nicht.",
    ],
  },
  steps: {
    label: "So laufen Projekte bei uns",
    heading: "Vom Ablauf zur fertigen Anwendung.",
    items: [
      {
        title: "Ablauf verstehen",
        text: "Wir schauen uns Ihren bestehenden Ablauf an: Was wird heute wie erfasst, wo hakt es, was muss die Software wirklich können.",
      },
      {
        title: "Konzept & Angebot",
        text: "Daraus entsteht ein klar umrissener Funktionsumfang mit einem individuellen, transparenten Angebot — vor Projektstart, nicht danach.",
      },
      {
        title: "Build, Test & Übergabe",
        text: "Wir entwickeln die Anwendung, testen sie mit echten Daten aus Ihrem Betrieb und übergeben sie einsatzbereit, inklusive Einweisung.",
      },
    ],
  },
  included: {
    label: "Leistungsumfang",
    heading: "Was in einem Software-Projekt steckt — und was nicht.",
    items: [
      "Analyse des bestehenden Ablaufs und der benötigten Daten",
      "Individuelles Datenmodell statt starrem Standardformular",
      "Web-Anwendung, nutzbar im Browser ohne lokale Installation",
      "Anbindung an bestehende Werkzeuge, soweit sinnvoll und machbar",
      "Übergabe mit Einweisung und Dokumentation der Bedienung",
      "Wartung und Weiterentwicklung optional über die Website-Wache",
    ],
    note: "Ehrliche Grenzen: Individuelle Software ist kein Ersatz für ein vollständiges ERP-System oder eine Buchhaltungssoftware mit Finanzamts-Schnittstelle. Wir bauen fokussierte Anwendungen für konkrete Abläufe — Umfang und technische Grenzen klären wir vorab gemeinsam.",
  },
  pricing: {
    label: "Kalkulation",
    heading: "Kein Festpreis von der Stange — ein individuelles Angebot.",
    tiers: [
      {
        name: "Individuelle Anwendung",
        price: "Individuelles Angebot",
        priceNote: "nach Aufwand",
        highlight: true,
        features: [
          "Umfang und Anzahl der benötigten Funktionen",
          "Komplexität des Datenmodells und der Abläufe",
          "Schnittstellen zu bestehenden Systemen",
          "Umfang von Tests, Übergabe und Einweisung",
          "Optionale laufende Wartung und Weiterentwicklung",
        ],
      },
    ],
    footnote: `${TAX_NOTE} Den konkreten Preis legen wir erst nach dem Erstgespräch fest, wenn der Funktionsumfang klar ist.`,
    image: {
      src: "/work/carbon-care.jpg",
      alt: "Carbon-Care-Rechnungssoftware mit Rechnungsübersicht, Status und Zahlungsstand – Demoansicht mit Beispieldaten",
      caption: "Aus der Praxis: Carbon-Care-Rechnungssoftware · Demoansicht mit Beispieldaten",
    },
  },
  faq: {
    label: "FAQ",
    heading: "Häufige Fragen.",
    items: [
      {
        q: "Was kostet individuelle Software?",
        a: "Das hängt vom Funktionsumfang ab. Es gibt keinen pauschalen Startpreis — im kostenlosen Erstgespräch klären wir Ihren Bedarf und Sie bekommen danach ein konkretes, verbindliches Angebot.",
      },
      {
        q: "Gibt es ein Beispiel aus der Praxis?",
        a: "Ja. Für Carbon Care haben wir eine individuelle Rechnungssoftware gebaut, die im täglichen Betrieb läuft. Details dazu finden Sie auf der Projektseite unten.",
      },
      {
        q: "Ersetzt das ein ERP-System oder eine Buchhaltungssoftware?",
        a: "Nein. Wir bauen fokussierte Anwendungen für konkrete Abläufe wie Rechnungen oder interne Datenpflege — keine vollständige Finanzbuchhaltung mit Finanzamts-Anbindung. Ob das für Ihren Fall passt, klären wir ehrlich im Erstgespräch.",
      },
      {
        q: "Wie lange dauert ein Software-Projekt?",
        a: "Das hängt vom Funktionsumfang ab. Nach dem Konzept- und Angebotsschritt nennen wir einen konkreten Zeitplan, bevor die Entwicklung startet.",
      },
      {
        q: "Übernehmen Sie auch die spätere Pflege?",
        a: "Auf Wunsch ja — über die Website-Wache mit Überwachung, kleinen Anpassungen und Updates nach Absprache.",
      },
    ],
  },
  cta: {
    heading: "Welchen Ablauf wollen wir für Sie vereinfachen?",
    text: "In der kostenlosen Erstberatung schauen wir uns Ihren aktuellen Ablauf an und sagen Ihnen ehrlich, ob und wie sich eine eigene Anwendung lohnt.",
  },
  consultationHref: "/consultation?package=request_offer",
  references: {
    heading: "Ein umgesetztes Software-Projekt.",
    items: [
      {
        name: "Carbon Care · Rechnungssoftware",
        text: "Individuelle Rechnungssoftware für den täglichen Betrieb: Rechnungsübersicht, Status und Zahlungsstand statt Zettelwirtschaft. Live seit 02/2026.",
        href: "https://carbon-care.de",
        label: "Kundenwebsite ansehen",
        internalLink: { href: "/projekte/carbon-care", label: "Projektseite ansehen" },
      },
    ],
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "Website-Wache (Wartung)", href: "/website-wache" },
      { label: "Website-Rettung", href: "/website-rettung" },
    ],
  },
};

export default function IndividuelleSoftwarePage() {
  return (
    <>
      <JsonLd data={getServiceSchema({ name: TITLE, description: DESCRIPTION, url: URL })} />
      <ServiceLanding data={data} />
    </>
  );
}
