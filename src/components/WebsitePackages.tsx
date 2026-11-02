"use client";

import { useState } from "react";
import Link from "next/link";
import { websiteStages, formatEuro, websiteTermsDe, websiteTermsEn, taxNoteDe, taxNoteEn, type WebsiteModel } from "@/lib/websitePricing";

// Most chosen stage per pricing model.
const popularStage: Record<WebsiteModel, string> = { kauf: "gefunden", betreut: "gebucht" };

export default function WebsitePackages({ lang = "de" }: { lang?: "de" | "en" }) {
  const [model, setModel] = useState<WebsiteModel>("kauf");
  const de = lang === "de";
  const entry = websiteStages[0];
  return (
    <div data-website-packages>
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="inline-flex border border-pfBorderMid bg-pfCard p-1" role="group" aria-label={de ? "Preismodell" : "Pricing model"}>
          {(["kauf", "betreut"] as const).map((value) => {
            const active = model === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setModel(value)}
                className={`inline-flex min-h-[44px] items-center gap-3 px-5 font-mono text-xs font-bold uppercase tracking-[0.16em] transition-colors md:px-7 ${active ? "bg-pfAccent text-black" : "text-pfText hover:text-pfAccent"}`}
              >
                {value === "kauf" ? (de ? "Kauf" : "Purchase") : (de ? "Betreut" : "Managed")}
                {value === "betreut" && (
                  <span className={`border px-2 py-0.5 text-[0.6rem] tracking-[0.1em] ${active ? "border-black/30 text-black" : "border-pfAccent text-pfAccent"}`}>
                    {de ? `ab ${formatEuro(entry.monthly)}/Monat` : `from ${formatEuro(entry.monthly, lang)}/mo`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="max-w-2xl text-center text-sm leading-6 text-pfSubtle">
          {model === "kauf" ? (
            <>
              {de ? "Einmal zahlen, die Website gehört Ihnen. Lieber klein starten? " : "Pay once and own the website. Prefer a smaller start? "}
              <button type="button" onClick={() => setModel("betreut")} className="text-pfAccent underline decoration-pfAccent underline-offset-4 hover:text-pfText">
                {de ? `Betreut ab ${formatEuro(entry.setup)} + ${formatEuro(entry.monthly)}/Monat` : `Managed from ${formatEuro(entry.setup, lang)} + ${formatEuro(entry.monthly, lang)}/month`}
              </button>
            </>
          ) : de ? (
            "Kleiner Startbetrag. Hosting, Domain, Updates und Änderungen sind inklusive. Nur für Unternehmen."
          ) : (
            "Small upfront cost. Hosting, domain, updates and changes included. Businesses only."
          )}
        </p>
      </div>
      <div className="grid gap-px border border-pfBorder bg-pfBorder lg:grid-cols-3" aria-live="polite">
        {websiteStages.map((stage) => {
          const popular = popularStage[model] === stage.id;
          return (
            <article
              key={stage.id}
              data-popular={popular || undefined}
              // On desktop each card spans the parent rows via subgrid, so prices and dividers line up across cards.
              className={`relative flex flex-col gap-5 p-6 md:p-8 lg:grid lg:grid-rows-subgrid ${model === "betreut" ? "lg:row-span-6" : "lg:row-span-5"} ${popular ? "bg-pfCardHover outline outline-1 -outline-offset-1 outline-pfAccent" : "bg-pfCard"}`}
            >
              <div className="flex min-h-[2.5rem] items-start justify-between gap-4">
                <h3 className="font-display text-4xl leading-none text-pfText">{stage.name}</h3>
                {popular && (
                  <span className="shrink-0 bg-pfAccent px-2.5 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-black">
                    {de ? "Am beliebtesten" : "Most popular"}
                  </span>
                )}
              </div>
              <p className="text-base leading-7 text-pfText lg:min-h-14">{de ? stage.de : stage.en}</p>
              <div className="text-pfAccent">
                <p className="font-display text-4xl leading-none">{formatEuro(model === "kauf" ? stage.purchase : stage.setup, lang)}</p>
                <p className="mt-2 text-sm">{model === "kauf" ? (de ? "einmalig" : "once") : (de ? `Einrichtung + ${formatEuro(stage.monthly)} / Monat 1–24` : `setup + ${formatEuro(stage.monthly, lang)} / month 1–24`)}</p>
              </div>
              <p className="flex-1 text-sm leading-7 text-pfSubtle">{de ? stage.scope : stage.scopeEn}</p>
              {model === "betreut" && <div className="border-t border-pfBorder pt-4 text-sm leading-7 text-pfSubtle"><p>{de ? "Pro Monat: " : "Per month: "}{de ? stage.changes : stage.changesEn}</p><p>{de ? "Ab Monat 25: " : "From month 25: "}{formatEuro(stage.later, lang)} / {de ? "Monat" : "month"}, {de ? stage.laterChanges : stage.laterChangesEn}</p></div>}
              <Link href={`/consultation?package=${stage.id}&modell=${model}&lang=${lang}`} className={`${popular ? "btn-accent" : "btn-outline"} self-start lg:self-end lg:justify-self-start`} prefetch={false}>{de ? "Stufe besprechen" : "Discuss this package"} →</Link>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-sm leading-7 text-pfSubtle">{de ? "In allen Stufen: mobile Umsetzung, Kontakt/WhatsApp/Anruf, Karte, Impressum/Datenschutz eingebunden und Basis-SEO. Google-Unternehmensprofil ab Gefunden." : "All stages include mobile delivery, contact/WhatsApp/call links, map, integration of legal notice and privacy policy, and basic SEO. Google Business Profile from Gefunden."}</p>
      <p className="mt-4 text-sm leading-7 text-pfSubtle">{de ? websiteTermsDe : websiteTermsEn}</p>
      <p className="mt-4 text-xs leading-6 text-pfMuted">{de ? taxNoteDe : taxNoteEn}</p>
    </div>
  );
}
