"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";
import type { ProductKey } from "@/lib/products";

export default function PackageCard({ id }: { id: ProductKey; isAuthed?: boolean }) {
  const { t, lang } = useI18n();
  const href = id === "ai_readiness" ? "https://audit.pagefoundry.de" : id === "software" ? "/individuelle-software" : `/consultation?package=${id}&lang=${lang}`;
  return (
    <article className="pf-card h-full rounded-none flex flex-col gap-4 p-6">
      <h4 className="font-display text-3xl text-pfText">{t(`products.${id}.title`)}</h4>
      <p className="text-pfAccent font-mono text-sm">{t(`products.${id}.from`)}</p>
      <p className="text-pfSubtle text-sm leading-7 flex-1">{t(`products.${id}.desc`)}</p>
      <Link href={href} className="btn-outline mt-auto self-start" prefetch={false}>
        {id === "free_consultation" ? t("products.cta.book") : t("products.cta.getStarted")}
      </Link>
    </article>
  );
}
