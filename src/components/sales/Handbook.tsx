"use client";

import { cardClass, mono } from "./ui";

type Pkg = { id: string; name: string; description: string; purchase: number; setup: number; monthly: number; changes: string };
const euro0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg text-pfText">{children}</h2>;
}

function Line({ who, children }: { who: "Du" | "Kunde" | "Tipp"; children: React.ReactNode }) {
  const tone = who === "Du" ? "text-pfAccent" : who === "Kunde" ? "text-pfSubtle" : "text-pfMuted";
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-3 py-1.5 text-sm">
      <span className={`text-[0.65rem] uppercase tracking-widest ${tone}`} style={mono}>{who}</span>
      <span className={who === "Du" ? "text-pfText" : "text-pfSubtle"}>{children}</span>
    </div>
  );
}

export default function Handbook({ repName, packages, taxNote }: { repName: string; packages: Pkg[]; taxNote: string }) {
  return (
    <div className="space-y-10">
      <section className={cardClass}>
        <H>Dein Arbeitstag in 6 Schritten</H>
        <ol className="space-y-3 text-sm text-pfSubtle">
          <li><b className="text-pfText">1. „Anrufe heute“ öffnen.</b> Jeden Morgen stehen 30 geprüfte Firmen aus NRW bereit. Die Reihenfolge ist die Priorität: zuerst Firmen mit kaputter Website, dann mit schwacher, dann ohne Website. Fällige Rückrufe stehen ganz oben.</li>
          <li><b className="text-pfText">2. Kontakt aufklappen, 20 Sekunden vorbereiten.</b> Anrufgrund lesen, „Aktuelle Website ansehen“ bzw. „Neue Website suchen“ klicken. Stimmt der Grund nicht (Firma hat längst eine neue Seite), nicht anrufen, sondern im Gespräch-Fenster „Hat neue Website“ wählen.</li>
          <li><b className="text-pfText">3. Häkchen setzen, „Anrufen“.</b> Das Häkchen bestätigt: Grund passt, Gegenüber ist ein Unternehmen. Danach öffnet sich das Gesprächsfenster mit Leitfaden; oben tippst du auf die Nummer, dann wählt dein Handy.</li>
          <li><b className="text-pfText">4. Gespräch führen, direkt protokollieren.</b> Erreicht? Mit wem? Ergebnis? Das dauert 30 Sekunden und ist Pflicht für jeden Anruf. Nicht erreicht → kommt automatisch am nächsten Werktag wieder (max. 3 Versuche).</li>
          <li><b className="text-pfText">5. Demo gewünscht?</b> E-Mail und ein kurzes Briefing eintragen. Fabian bekommt die Anfrage sofort, baut die Demo und meldet sich mit dem Link. Du bekommst eine Mail, der Link erscheint unter „Demos“.</li>
          <li><b className="text-pfText">6. Demo an den Kunden senden.</b> Unter „Demos“ Text prüfen und „An Kunden senden“. Ein Nachfass-Anruf wird automatisch in drei Werktagen eingeplant. Will der Kunde ein Angebot, übernimmt Fabian Angebot und Vertrag; deine Provision ist über den Lead gesichert.</li>
        </ol>
      </section>

      <section className={cardClass}>
        <H>Das Skript (zum Auswendiglernen)</H>
        <p className="mb-4 text-sm text-pfSubtle">Ruhig, freundlich, kurz. Ziel ist nicht der Verkauf am Telefon, sondern eine kostenlose Demo-Seite. Die Demo verkauft.</p>
        <div className="space-y-5">
          <div>
            <div className="label-mono mb-2">1 · Einstieg (unter 15 Sekunden)</div>
            <Line who="Du">Guten Tag, hier ist {repName} von PageFoundry aus Hückeswagen. Spreche ich mit dem Inhaber oder der Inhaberin?</Line>
            <Line who="Tipp">Nicht Inhaber? „Wer kümmert sich bei Ihnen um die Website? Wann erreiche ich die Person am besten?“ → Ergebnis „Rückruf“ mit Namen.</Line>
          </div>
          <div>
            <div className="label-mono mb-2">2 · Anlass nennen (je nach Kategorie)</div>
            <Line who="Du"><b>Website kaputt:</b> Ich rufe an, weil uns aufgefallen ist, dass Ihre Website gerade nicht erreichbar ist. Wussten Sie das schon, oder haben Sie inzwischen eine neue Seite?</Line>
            <Line who="Du"><b>Website schwach:</b> Wir bauen Websites für Betriebe in NRW. Bei Ihrer Seite sind mir ein, zwei konkrete Punkte aufgefallen, zum Beispiel [Anrufgrund]. Darf ich kurz sagen, was ich meine?</Line>
            <Line who="Du"><b>Keine Website:</b> Ich habe online keine Website von Ihnen gefunden. Ist das bewusst so, oder gibt es eine, die ich übersehen habe?</Line>
            <Line who="Tipp">Nur sagen, was im Anrufgrund steht. Nie übertreiben („Sie verlieren Kunden“), nie Rechtsverstöße unterstellen.</Line>
          </div>
          <div>
            <div className="label-mono mb-2">3 · Zwei Bedarfsfragen</div>
            <Line who="Du">Wie finden neue Kunden Sie heute hauptsächlich?</Line>
            <Line who="Du">Was wäre Ihnen an einer Website am wichtigsten: mehr Anfragen, Termine, Vertrauen oder Stellenanzeigen?</Line>
            <Line who="Tipp">Zuhören, die Antwort im Protokoll unter „Größtes Problem“ notieren. Das braucht Fabian für die Demo.</Line>
          </div>
          <div>
            <div className="label-mono mb-2">4 · Angebot: kostenlose Demo</div>
            <Line who="Du">Ich mache Ihnen einen Vorschlag: Wir bauen Ihnen kostenlos und unverbindlich eine Demo-Seite für Ihren Betrieb. Sie schauen sie sich in Ruhe an und entscheiden dann. Darf ich Ihnen den Link per E-Mail schicken?</Line>
          </div>
          <div>
            <div className="label-mono mb-2">5 · Bei Ja: Briefing in 5 Fragen</div>
            <Line who="Du">An welche E-Mail-Adresse darf ich den Link schicken?</Line>
            <Line who="Du">Was bieten Sie genau an, und was davon soll man auf der Seite zuerst sehen?</Line>
            <Line who="Du">Wer sind Ihre typischen Kunden, eher privat oder Firmen, eher hier aus der Gegend?</Line>
            <Line who="Du">Haben Sie ein Logo oder Hausfarben? Gibt es Fotos von Ihnen oder Ihrem Betrieb?</Line>
            <Line who="Du">Gibt es etwas, das Ihnen an anderen Websites gut gefällt?</Line>
            <Line who="Tipp">Alles stichpunktartig ins Briefing. Je konkreter, desto besser die Demo.</Line>
          </div>
          <div>
            <div className="label-mono mb-2">6 · Abschluss</div>
            <Line who="Du">Super, dann meldet sich das Team in den nächsten Tagen mit dem Link, und ich rufe Sie danach kurz an, um zu hören, wie sie Ihnen gefällt. Vielen Dank für Ihre Zeit, Herr/Frau …!</Line>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <H>Einwände</H>
        <div className="space-y-4">
          {[
            ["„Kein Interesse.“", "Verstehe ich. Darf ich fragen: Liegt das daran, dass Sie gut ausgelastet sind, oder dass die Website gerade kein Thema ist? (Antwort annehmen, freundlich verabschieden, Ergebnis „Kein Interesse“.)"],
            ["„Keine Zeit.“", "Kein Problem, dann halte ich es kurz. Wann passt es Ihnen besser? Morgen Vormittag oder eher nachmittags? (Ergebnis „Rückruf“ mit Termin.)"],
            ["„Was kostet das?“", "Die Demo ist kostenlos. Eine fertige Website gibt es bei uns zu Festpreisen, zum Beispiel ab 790 € einmalig oder betreut ab 49 € im Monat. Am besten schauen Sie erst die Demo an, dann wissen Sie, ob es passt."],
            ["„Zu teuer.“", "Verstehe. Deshalb gibt es die betreute Variante: kleine Einrichtung, feste Monatsrate, Hosting und Änderungen inklusive. Die Demo kostet Sie nichts."],
            ["„Haben wir schon / macht mein Neffe.“", "Gut, dass Sie versorgt sind. Sind Sie mit den Anfragen über die Seite zufrieden? (Wenn ja: freundlich verabschieden.)"],
            ["„Schicken Sie mir was per Mail.“", "Gern. Damit es für Sie passt: Darf ich Ihnen eine kostenlose Demo-Seite für Ihren Betrieb an Ihre E-Mail schicken? (Ja → „Demo gewünscht“ mit E-Mail. Nur Infos ohne Demo → „Angebot gewünscht“ und E-Mail in Notizen.)"],
            ["„Woher haben Sie meine Nummer?“", "Aus öffentlich zugänglichen Firmenverzeichnissen und Kartendiensten, in denen Ihr Betrieb eingetragen ist. Wenn Sie keine Anrufe von uns möchten, trage ich Sie sofort aus. (Bei Wunsch: „Nicht mehr anrufen“.)"],
            ["„Bitte nicht mehr anrufen.“", "Selbstverständlich, ich trage Sie sofort aus. Entschuldigen Sie die Störung, schönen Tag noch! (Sofort „Nicht mehr anrufen“. Das sperrt Telefon und E-Mail-Werbung dauerhaft.)"],
          ].map(([q, a]) => (
            <div key={q} className="border-t border-pfBorder pt-3">
              <div className="text-sm text-pfText">{q}</div>
              <p className="mt-1 text-sm text-pfSubtle">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <H>Spielregeln (wichtig, rechtlich)</H>
        <ul className="list-disc space-y-2 pl-5 text-sm text-pfSubtle">
          <li><b className="text-pfText">Nur Unternehmen anrufen.</b> Privatpersonen nie, auch nicht, wenn die Nummer in der Liste steht. Wirkt das Gegenüber privat, freundlich beenden und „Falsche Nummer“ wählen.</li>
          <li><b className="text-pfText">Keine Kalt-Mails.</b> E-Mails gehen nur an Kunden, die am Telefon ausdrücklich zugestimmt haben (Demo-Link, Angebot).</li>
          <li><b className="text-pfText">Widerspruch sofort respektieren.</b> „Bitte nicht mehr anrufen“ heißt: sofort austragen, keine Diskussion.</li>
          <li><b className="text-pfText">Rufnummer nicht unterdrücken.</b> Immer mit sichtbarer Nummer anrufen und dich mit Namen und PageFoundry vorstellen.</li>
          <li><b className="text-pfText">Nichts aufnehmen.</b> Gespräche nie aufzeichnen. Notizen im Protokoll sind in Ordnung.</li>
          <li><b className="text-pfText">Nur Wahres sagen.</b> Nur den angezeigten Anrufgrund nennen. Keine Ranking-Garantien, keine Rechtsberatung, keine Rabatte versprechen.</li>
          <li><b className="text-pfText">Keine Verträge am Telefon.</b> Angebot und Vertrag kommen von Fabian. Du sammelst Interesse und Briefing.</li>
          <li><b className="text-pfText">Anrufzeiten:</b> werktags etwa 9 bis 12 und 14 bis 17 Uhr. Gastronomie besser zwischen 14 und 17 Uhr.</li>
        </ul>
      </section>

      <section>
        <H>Preise zum Nachschlagen</H>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {packages.map((p) => (
            <div key={p.id} className={cardClass}>
              <div className="label-mono mb-2">{p.name}</div>
              <p className="mb-3 text-sm text-pfSubtle">{p.description}</p>
              <p className="text-sm text-pfText">Kauf: {euro0.format(p.purchase)} einmalig</p>
              <p className="text-sm text-pfText">Betreut: {euro0.format(p.setup)} + {euro0.format(p.monthly)}/Monat (24 Monate)</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-pfSubtle">{taxNote} Betreut nur für Unternehmen. Details und Bedingungen siehe „Verträge“.</p>
      </section>
    </div>
  );
}
