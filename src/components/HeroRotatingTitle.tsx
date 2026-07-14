"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Kurz halten: der Uebergang darf nie sekundenlang Buchstabensalat zeigen.
const FRAME_MS = 30;
const CHARS_PER_FRAME = 3;
const ROTATE_MS = 3600;

type Props = {
  phrases: readonly string[];
};

export default function HeroRotatingTitle({ phrases }: Props) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState(phrases[0] ?? "");
  const reduceMotionRef = useRef(false);

  const longestPhrase = useMemo(
    () => phrases.reduce((longest, phrase) => (phrase.length > longest.length ? phrase : longest), ""),
    [phrases],
  );

  useEffect(() => {
    if (phrases.length < 2) return;

    // Bei reduzierter Bewegung bleibt die erste Phrase dauerhaft stehen —
    // auch der Phrasenwechsel selbst ist Bewegung.
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = media.matches;
    const onChange = (event: MediaQueryListEvent) => {
      reduceMotionRef.current = event.matches;
    };
    media.addEventListener("change", onChange);

    const interval = window.setInterval(() => {
      if (reduceMotionRef.current || document.hidden) return;
      setIndex((current) => (current + 1) % phrases.length);
    }, ROTATE_MS);

    return () => {
      media.removeEventListener("change", onChange);
      window.clearInterval(interval);
    };
  }, [phrases.length]);

  useEffect(() => {
    const target = phrases[index] ?? "";

    if (index === 0 || reduceMotionRef.current) {
      setDisplay(target);
      return;
    }

    // Progressive Aufloesung von links: bei 3 Zeichen pro Frame ist selbst die
    // laengste Phrase nach ~0,4 s vollstaendig lesbar.
    let resolved = 0;
    const interval = window.setInterval(() => {
      resolved += CHARS_PER_FRAME;
      if (resolved >= target.length) {
        window.clearInterval(interval);
        setDisplay(target);
        return;
      }
      setDisplay(
        target
          .split("")
          .map((char, charIndex) => {
            if (char === " " || charIndex < resolved) return char;
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          })
          .join(""),
      );
    }, FRAME_MS);

    return () => window.clearInterval(interval);
  }, [index, phrases]);

  return (
    <span className="relative block min-h-[2.75em] sm:min-h-[2.1em] lg:min-h-[1.8em]">
      <span className="invisible block" aria-hidden="true">
        {longestPhrase}
      </span>
      {/* Screenreader bekommen den stabilen Text, nie den Scramble-Zwischenstand. */}
      <span className="sr-only">{phrases[index] ?? phrases[0] ?? ""}</span>
      <span className="absolute inset-0 block" aria-hidden="true">
        {display}
      </span>
    </span>
  );
}
