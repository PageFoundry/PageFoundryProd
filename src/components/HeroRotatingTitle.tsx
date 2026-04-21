"use client";

import { useEffect, useMemo, useState } from "react";

const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

type Props = {
  phrases: readonly string[];
};

export default function HeroRotatingTitle({ phrases }: Props) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState(phrases[0] ?? "");

  const longestPhrase = useMemo(
    () => phrases.reduce((longest, phrase) => (phrase.length > longest.length ? phrase : longest), ""),
    [phrases],
  );

  useEffect(() => {
    if (phrases.length < 2) return;

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % phrases.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [phrases.length]);

  useEffect(() => {
    const target = phrases[index] ?? "";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setDisplay(target);
      return;
    }

    let frame = 0;
    const maxFrames = Math.max(18, target.length + 8);
    const interval = window.setInterval(() => {
      setDisplay(
        target
          .split("")
          .map((char, charIndex) => {
            if (char === " " || charIndex < frame - 4) return char;
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          })
          .join(""),
      );

      frame += 1;
      if (frame > maxFrames) {
        window.clearInterval(interval);
        setDisplay(target);
      }
    }, 32);

    return () => window.clearInterval(interval);
  }, [index, phrases]);

  return (
    <span className="relative block min-h-[2.75em] sm:min-h-[2.1em] lg:min-h-[1.8em]">
      <span className="invisible block" aria-hidden="true">
        {longestPhrase}
      </span>
      <span className="absolute inset-0 block">{display}</span>
    </span>
  );
}
