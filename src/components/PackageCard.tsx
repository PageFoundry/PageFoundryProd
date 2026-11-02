"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";
import type { ProductKey } from "@/lib/products";

// `wide` lays the card out as one full-width row (used for a lone last card in the grid).
export default function PackageCard({ id, wide = false }: { id: ProductKey; isAuthed?: boolean; wide?: boolean }) {
  const { t, lang } = useI18n();
  const href = id === "ai_readiness" ? "https://audit.pagefoundry.de" : id === "software" ? "/individuelle-software" : `/consultation?package=${id}&lang=${lang}`;
  return (
    <article className={`flex h-full flex-col gap-4 bg-pfCard p-6 transition-colors hover:bg-pfCardHover md:p-8 ${wide ? "lg:flex-row lg:items-center lg:gap-10" : ""}`}>
      <div className={wide ? "lg:w-1/3" : ""}>
        <h4 className="font-display text-3xl leading-none text-pfText">{t(`products.${id}.title`)}</h4>
        <p className="mt-3 font-mono text-sm text-pfAccent">{t(`products.${id}.from`)}</p>
      </div>
      <p className="flex-1 text-sm leading-7 text-pfSubtle">{t(`products.${id}.desc`)}</p>
      <Link href={href} className={`btn-outline self-start ${wide ? "lg:self-center" : "mt-auto"}`} prefetch={false}>
        {id === "free_consultation" ? t("products.cta.book") : t("products.cta.getStarted")}
      </Link>
    </article>
  );
}
