"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./TheLoftComparison.module.css";

const examples = [
  {
    topic: "Speisekarte",
    detail: "Der Link zur digitalen Karte blieb erhalten. Seit dem Relaunch stehen die Wuppertaler Adresse und der Zugang zur Karte zusammen im ersten Bildschirm.",
    height: 1300,
    shots: [
      { version: "Vorher", date: "April 2026", src: "/work/the-loft-home-before-2x.webp", alt: "Frühere mobile Startseite mit weißer Kopfzeile und orangefarbenem Button zur Speisekarte." },
      { version: "Nachher", date: "November 2026", src: "/work/the-loft-home-after-2x.webp", alt: "Neue mobile Startseite mit Restaurantfoto, Adresse und goldenem Button zur Speisekarte." },
    ],
  },
  {
    topic: "Öffnungszeiten",
    detail: "Früher standen die Zeiten in der Fußzeile. Heute finden Gäste Brunchzeiten und allgemeine Öffnungszeiten in zwei eigenen Feldern im Restaurantbereich.",
    height: 696,
    shots: [
      { version: "Vorher", date: "April 2026", src: "/work/the-loft-hours-before-2x.webp", alt: "Frühere Fußzeile mit Öffnungszeiten sowie den Brunchzeiten für Werktage und Wochenende." },
      { version: "Nachher", date: "November 2026", src: "/work/the-loft-hours-after-2x.webp", alt: "Zwei Felder der neuen Website zeigen die täglichen Brunchzeiten und die gesamten Öffnungszeiten." },
    ],
  },
] as const;

export default function TheLoftComparison() {
  const [topic, setTopic] = useState(0);
  const [version, setVersion] = useState(1);

  return (
    <section id="mobiler-vergleich" aria-labelledby="vergleich-titel" className="scroll-mt-20 border-t border-pfBorder px-5 py-14 sm:px-8 md:py-20">
      <div className={styles.spread}>
        <div className={styles.intro}>
          <h2 id="vergleich-titel" className="text-balance font-display text-5xl leading-[0.95] text-pfText md:text-6xl">Der Relaunch im Vergleich</h2>
          <div className={styles.topics} role="group" aria-label="Ansicht auswählen">
            {examples.map((example, index) => (
              <button key={example.topic} type="button" aria-pressed={topic === index} onClick={() => setTopic(index)}>
                {example.topic}
              </button>
            ))}
          </div>
          <p className={styles.detail}>{examples[topic].detail}</p>
          <p className={styles.source}>
            Frühere Website aus dem <a href="https://web.archive.org/web/20260410193012/https://theloftbrunch.de/">Webarchiv vom 10. April 2026</a>.
            Die neue Fassung wurde am 17. November 2026 aufgenommen.
          </p>
        </div>
        <div className={styles.stage}>
          <div className={styles.versions} role="group" aria-label="Website-Version auswählen">
            {examples[topic].shots.map((shot, index) => (
              <button key={shot.version} type="button" aria-pressed={version === index} onClick={() => setVersion(index)}>{shot.version}</button>
            ))}
          </div>
          {examples.map((example, index) => (
            <div key={example.topic} className={styles.pair} hidden={topic !== index} aria-label={example.topic} role="group">
              {example.shots.map((shot, side) => (
                <figure key={shot.src} className={styles.shot} data-selected={side === version}>
                  <figcaption>
                    <span>{shot.version}</span>
                    <span>{shot.date}</span>
                  </figcaption>
                  <a href={shot.src} className={styles.fullsize} aria-label={`${example.topic} – ${shot.version} in Originalgröße öffnen`}>
                    <Image src={shot.src} alt={shot.alt} width={780} height={example.height} sizes="(max-width: 719px) min(78vw, 325px), (max-width: 1023px) 38vw, 325px" />
                  </a>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
