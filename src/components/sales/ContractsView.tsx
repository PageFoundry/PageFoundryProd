"use client";

import { cardClass, mono } from "./ui";

type Doc = { file: string; title: string; offer: string; when: string };

export default function ContractsView({ docs }: { docs: Doc[] }) {
  return (
    <div className="space-y-6">
      <div className={`${cardClass} space-y-2 text-sm text-pfSubtle`}>
        <p className="text-pfText">So läuft es mit Verträgen</p>
        <p>Du verschickst keine Verträge selbst. Wenn ein Kunde ein Angebot will, setzt du im Lead „Angebot“ und schreibst die gewünschte Leistung in die Notiz. Fabian erstellt Angebot und Vertrag mit den Kundendaten, schickt sie zur Unterschrift und setzt den Lead nach Abschluss auf „Gewonnen“. Dann zählt deine Provision.</p>
        <p>Die Vorlagen hier sind zum Lesen und Erklären: Was bekommt der Kunde, wie lange läuft es, was kostet es. Platzhalter in eckigen Klammern füllt Fabian pro Kunde aus.</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {docs.map((d) => (
          <li key={d.file} className={`${cardClass} flex flex-col`}>
            <div className="label-mono mb-2">{d.offer}</div>
            <div className="text-pfText">{d.title}</div>
            <p className="mt-2 flex-1 text-sm text-pfSubtle">{d.when}</p>
            <a href={`/api/sales/documents/${encodeURIComponent(d.file)}`} target="_blank" rel="noopener" className="mt-4 inline-block self-start rounded-sm border border-pfBorder px-3 py-2 text-[0.62rem] uppercase tracking-widest text-pfAccent hover:border-pfBorderAccent" style={mono}>
              PDF öffnen
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
