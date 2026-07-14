import Link from "next/link";
import type { ProductKey } from "@/lib/products";
import { getServerI18n } from "@/i18n/server";

interface Props {
  id: ProductKey;
  isAuthed: boolean;
}

export default async function PackageCard({ id, isAuthed }: Props) {
  const { t } = await getServerI18n();

  const title = t(`products.${id}.title`);
  const desc  = t(`products.${id}.desc`);
  const from  = t(`products.${id}.from`);

  const href  = id === "free_consultation" ? "/consultation" : `/checkout/${id}`;
  const label = id === "free_consultation"
    ? t("products.cta.book")
    : t("products.cta.getStarted");

  const isFeatured = id === "free_consultation";

  return (
    <div
      className={`pf-card flex flex-col gap-4 p-6 relative overflow-hidden ${
        isFeatured ? "border-pfBorderAccent bg-pfAccentDim" : ""
      }`}
    >
      {isFeatured && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 20% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)",
          }}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <span
          className="text-pfText font-semibold text-base leading-snug"
          style={{ fontFamily: "var(--font-display), Impact, sans-serif", letterSpacing: "0.03em", fontSize: "1.3rem" }}
        >
          {title}
        </span>
        <span
          className="shrink-0 font-mono text-[0.75rem] font-bold tracking-wider text-pfAccent"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {from}
        </span>
      </div>

      <p className="text-pfSubtle text-sm leading-relaxed flex-1">{desc}</p>

      {isFeatured ? (
        <Link href={href} className="btn-accent mt-auto self-start text-[0.68rem] px-4 py-2">
          {label} →
        </Link>
      ) : (
        <Link
          // Neukunden landen in der Beratung mit vorausgewaehltem Paket —
          // nie auf /login. Eingeloggte Bestandskunden gehen direkt in den Checkout.
          href={isAuthed ? href : `/consultation?package=${id}`}
          className="btn-outline mt-auto self-start text-[0.68rem] px-4 py-2"
          prefetch={false}
        >
          {label}
        </Link>
      )}
    </div>
  );
}
