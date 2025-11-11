"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductKey } from "@/lib/products";
import { useI18n } from "@/i18n/useI18n";

export default function PackageCard({ id }: { id: ProductKey }) {
  const { t } = useI18n();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/whoami", { credentials: "include" })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive) setIsAuthed(Boolean(j?.user?.id)); })
      .catch(() => { if (alive) setIsAuthed(false); });
    return () => { alive = false; };
  }, []);

  const title = t(`products.${id}.title`);
  const desc  = t(`products.${id}.desc`);
  const from  = t(`products.${id}.from`);

  // Immer direkt auf Checkout verlinken; Server schützt Route und leitet ggf. zu /login?next=… um.
  const href = id === "free_consultation" ? "/consultation" : `/checkout/${id}`;

  const label =
    id === "free_consultation"
      ? t("products.cta.book")
      : t("products.cta.getStarted");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm flex flex-col">
      <div className="text-white font-semibold text-lg">{title}</div>
      <div className="text-sm text-zinc-400 mt-2 flex-1">{desc}</div>
      <div className="text-xs text-zinc-500 mt-3">{from}</div>

      {id === "free_consultation" ? (
        <Link
          href={href}
          className="mt-6 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-pfOrange text-black hover:brightness-110"
        >
          {label}
        </Link>
      ) : (
        <Link
          href={href}
          aria-disabled={isAuthed === null}
          className={`mt-6 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold ${
            isAuthed === null
              ? "bg-zinc-600 cursor-wait text-black"
              : "bg-pfOrange text-black hover:brightness-110"
          }`}
          prefetch={false}
        >
          {isAuthed === null ? "…" : label}
        </Link>
      )}
    </div>
  );
}
