"use client";

import { useState } from "react";
import Link from "next/link";
import { websiteStages, formatEuro, websiteTermsDe, websiteTermsEn, taxNoteDe, taxNoteEn, type WebsiteModel } from "@/lib/websitePricing";

export default function WebsitePackages({ lang = "de" }: { lang?: "de" | "en" }) {
  const [model, setModel] = useState<WebsiteModel>("kauf");
  const de = lang === "de";
  return (
    <div data-website-packages>
      <div className="mb-8 flex justify-center gap-2" role="group" aria-label={de ? "Preismodell" : "Pricing model"}>
        {(["kauf", "betreut"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={model === value} onClick={() => setModel(value)} className={model === value ? "btn-accent" : "btn-outline"}>
            {value === "kauf" ? (de ? "Kauf" : "Purchase") : (de ? "Betreut" : "Managed")}
          </button>
        ))}
      </div>
      <div className="grid gap-px border border-pfBorder bg-pfBorder lg:grid-cols-3" aria-live="polite">
        {websiteStages.map((stage) => (
          <article key={stage.id} className="flex flex-col gap-5 bg-pfCard p-6 md:p-8">
            <h3 className="font-display text-4xl text-pfText">{stage.name}</h3>
            <p className="text-base leading-7 text-pfText lg:min-h-20">{de ? stage.de : stage.en}</p>
            <div className="text-pfAccent">
              <p className="font-display text-4xl">{formatEuro(model === "kauf" ? stage.purchase : stage.setup, lang)}</p>
              <p className="mt-2 text-sm">{model === "kauf" ? (de ? "einmalig" : "once") : (de ? `Einrichtung + ${formatEuro(stage.monthly)} / Monat 1–24` : `setup + ${formatEuro(stage.monthly, lang)} / month 1–24`)}</p>
            </div>
            <p className="flex-1 text-sm leading-7 text-pfSubtle">{de ? stage.scope : stage.scopeEn}</p>
            {model === "betreut" && <div className="border-t border-pfBorder pt-4 text-sm leading-7 text-pfSubtle"><p>{de ? "Pro Monat: " : "Per month: "}{de ? stage.changes : stage.changesEn}</p><p>{de ? "Ab Monat 25: " : "From month 25: "}{formatEuro(stage.later, lang)} / {de ? "Monat" : "month"}, {de ? stage.laterChanges : stage.laterChangesEn}</p></div>}
            <Link href={`/consultation?package=${stage.id}&modell=${model}&lang=${lang}`} className="btn-outline self-start" prefetch={false}>{de ? "Stufe besprechen" : "Discuss this package"} →</Link>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm leading-7 text-pfSubtle">{de ? "In allen Stufen: mobile Umsetzung, Kontakt/WhatsApp/Anruf, Karte, Impressum/Datenschutz eingebunden und Basis-SEO. Google-Unternehmensprofil ab Gefunden." : "All stages include mobile delivery, contact/WhatsApp/call links, map, integration of legal notice and privacy policy, and basic SEO. Google Business Profile from Gefunden."}</p>
      <p className="mt-4 text-sm leading-7 text-pfSubtle">{de ? websiteTermsDe : websiteTermsEn}</p>
      <p className="mt-4 text-xs leading-6 text-pfMuted">{de ? taxNoteDe : taxNoteEn}</p>
    </div>
  );
}
