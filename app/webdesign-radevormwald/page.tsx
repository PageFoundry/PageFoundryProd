import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { regionalPricing, regionalReferences } from "@/lib/seo/regionalWebdesign";

const TITLE = "Webdesign Radevormwald";
const DESCRIPTION = "Webdesign für Radevormwald aus Hückeswagen: bestehende Websites prüfen oder einen klaren Neustart planen. Vor-Ort-Termin nach Absprache, Landingpages ab 790 €.";
const PATH = "/webdesign-radevormwald";

export const metadata = createPageMetadata({ path: PATH, title: TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  pricing: regionalPricing,
  references: regionalReferences,
  "eyebrow": "Webdesign · Radevormwald",
  "heroHeading": "Webdesign für Radevormwald: Bestehendes prüfen, sinnvoll weiterbauen.",
  "heroSubline": "Eine ältere Website muss nicht automatisch komplett ersetzt werden. Für Handwerk, Handel und produzierende Betriebe in Radevormwald prüfe ich zuerst, ob Inhalte, Technik und Kontaktwege noch zu Ihrem heutigen Angebot passen. Ich bin Fabian Franke von PageFoundry in Hückeswagen und bespreche mit Ihnen, was bleiben kann und was einen Neustart braucht.",
  "problem": {
    "label": "Ihre Ausgangslage",
    "heading": "Die Website soll zum heutigen Betrieb passen.",
    "points": [
      "Hat sich Ihr Angebot verändert, führen alte Texte und Bilder leicht zu falschen Erwartungen. Ich stelle zuerst fest, welche Informationen tatsächlich aktuell sind.",
      "Fehlen Zugänge zu Domain, Hosting oder Website, ist ein Relaunch keine reine Gestaltungsaufgabe. Zuständigkeiten und technische Voraussetzungen kläre ich vor dem Angebot.",
      "Für produzierende Betriebe und Zulieferer sind Leistungen und Einsatzmöglichkeiten wichtig, für Handel und Handwerk oft Besuch oder Einsatzgebiet. Der Aufbau folgt Ihrem Kontaktbedarf."
    ]
  },
  "steps": {
    "label": "Zusammenarbeit",
    "heading": "Eine klare Entscheidung vor dem Relaunch.",
    "items": [
      {
        "title": "Bestand sichten",
        "text": "Ich schaue auf die bestehende Website, Ihre verfügbaren Inhalte und die bekannten Zugänge. Dabei halte ich offene technische Fragen fest."
      },
      {
        "title": "Weg entscheiden",
        "text": "Gezielte Überarbeitung, Website-Rettung oder neue Landingpage: Sie erhalten einen abgegrenzten Vorschlag mit dem passenden Preis und den nötigen Vorarbeiten."
      },
      {
        "title": "Übergang abstimmen",
        "text": "Bei einem Wechsel plane ich Domain, Veröffentlichung und Kontaktwege im vereinbarten Umfang. Eine Umstellung ohne Prüfung Ihrer Mail- und Hosting-Abhängigkeiten vermeide ich."
      }
    ]
  },
  "included": {
    "label": "Vereinbarter Umfang",
    "heading": "Ein Neustart mit geklärten Voraussetzungen.",
    "items": [
      "Sichtung vorhandener Texte, Bilder und technischer Grundlagen",
      "Abstimmung von Leistungsdarstellung und Kontaktbedarf",
      "Vereinbarter Plan für Veröffentlichung oder Überarbeitung",
      "Klare Zuständigkeit für den anschließenden technischen Betrieb"
    ],
    "note": "Texte, Bilder, Seitenumfang und spätere Betreuung werden im Angebot festgelegt. Ich verspreche weder bestimmte Google-Platzierungen noch feste Anfragezahlen."
  },
  "faq": {
    "label": "Fragen zur Zusammenarbeit",
    "heading": "Webdesign in Radevormwald: konkret besprochen.",
    "items": [
      {
        "q": "Ist ein Termin in Radevormwald möglich?",
        "a": "Ja. Die B 483 verbindet Hückeswagen mit Radevormwald. Ich kann Ihre Website nach Absprache persönlich in Ihrem Betrieb besprechen. PageFoundry sitzt in Hückeswagen und unterhält keine Niederlassung in Radevormwald."
      },
      {
        "q": "Können Domain und E-Mail beim bisherigen Anbieter bleiben?",
        "a": "Das prüfe ich anhand Ihrer bestehenden Verträge und Zugänge. Eine neue Website erfordert nicht grundsätzlich einen Umzug aller Dienste. Änderungen an Domain, Hosting und E-Mail werden ausdrücklich abgestimmt und nicht stillschweigend vorausgesetzt."
      },
      {
        "q": "Gibt es ein Beispiel für einen Relaunch?",
        "a": "The Loft in Wuppertal wechselte von einem WordPress-Theme mit Plugin-Stack zu einer statischen Website. Carbon Care zeigt dagegen den Aufbau einer neuen Landingpage plus eigenständiger Rechnungssoftware. Diese Projekte stehen für zwei unterschiedliche Ausgangslagen, nicht für Kundenreferenzen aus Radevormwald."
      }
    ]
  },
  "cta": {
    "heading": "Was soll an Ihrer bestehenden Website besser werden?",
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
        areaServed: { "@type": "City", name: "Radevormwald" },
      }} />
      <ServiceLanding data={data} />
    </>
  );
}
