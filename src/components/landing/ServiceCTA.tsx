import Link from "next/link";
import clsx from "clsx";

interface Props {
  heading: string;
  text: string;
  consultationHref?: string;
  compact?: boolean;
}

export default function ServiceCTA({ heading, text, consultationHref, compact = false }: Props) {
  const actionClass = compact && "!min-h-12 !rounded-lg !px-6 !py-3 !font-sans !text-sm !font-medium !normal-case !tracking-normal !transition-colors";

  return (
    <section className={clsx("relative flex items-center overflow-hidden px-6 py-24 text-center md:px-10", !compact && "min-h-[32rem] md:min-h-[40rem] md:py-32")}>
      {!compact && <>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfAccentDim md:h-[38rem] md:w-[38rem]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfBorderAccent md:h-[26rem] md:w-[26rem]" />
      </>}
      <div className="relative mx-auto w-full max-w-4xl">
        <h2 className={clsx("mx-auto max-w-3xl font-display text-5xl leading-none text-pfText md:text-7xl", compact && "text-balance")}>{heading}</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-pfSubtle">{text}</p>
        <div className={clsx("mt-10 flex flex-col justify-center gap-4 sm:flex-row sm:items-center", compact && "flex-wrap")}>
          <Link href={consultationHref ?? "/consultation"} className={clsx("btn-accent", actionClass)}>
            Kostenlose Beratung buchen →
          </Link>
          <a href="https://wa.me/4915167076918" className={clsx("btn-outline", actionClass)}>WhatsApp</a>
          {!compact && <a href="tel:+4921928743999" className="btn-outline">
            Telefon: 02192 8743999
          </a>}
        </div>
        {compact && <a href="tel:+4921928743999" className="mt-6 inline-flex min-h-11 items-center text-sm text-pfSubtle underline underline-offset-4 transition-colors hover:text-pfText">Telefon: 02192 8743999</a>}
        <p className="mt-4 text-xs leading-6 text-pfMuted">Telefon: Mein KI-Assistent nimmt an, ich rufe zurück.</p>
      </div>
    </section>
  );
}
