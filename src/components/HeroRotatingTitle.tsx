"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const ROTATE_MS = 5200;
const FADE_MS = 240;

type Props = {
  phrases: readonly string[];
};

export default function HeroRotatingTitle({ phrases }: Props) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
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

    let fadeTimer: number | undefined;
    const interval = window.setInterval(() => {
      if (reduceMotionRef.current || document.hidden) return;
      setVisible(false);
      fadeTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % phrases.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      media.removeEventListener("change", onChange);
      window.clearInterval(interval);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, [phrases.length]);

  return (
    <span className="relative block min-h-[2.75em] sm:min-h-[2.1em] lg:min-h-[1.8em]">
      <span className="invisible block" aria-hidden="true">
        {longestPhrase}
      </span>
      <span className="sr-only">{phrases[index] ?? phrases[0] ?? ""}</span>
      <span
        className={`absolute inset-0 block transition-opacity duration-300 ease-out motion-reduce:transition-none ${visible ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      >
        {phrases[index] ?? phrases[0] ?? ""}
      </span>
    </span>
  );
}
