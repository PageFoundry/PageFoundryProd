import Link from "next/link";

interface Props {
  heading: string;
  text: string;
  consultationHref?: string;
}

export default function ServiceCTA({ heading, text, consultationHref }: Props) {
  return (
    <section className="relative flex min-h-[32rem] items-center overflow-hidden px-6 py-24 text-center md:min-h-[40rem] md:px-10 md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfAccentDim md:h-[38rem] md:w-[38rem]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfBorderAccent md:h-[26rem] md:w-[26rem]" />
      <div className="relative mx-auto w-full max-w-4xl">
        <span className="label-mono mb-8 block">Nächster Schritt</span>
        <h2 className="mx-auto max-w-3xl font-display text-5xl leading-none text-pfText md:text-7xl">{heading}</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-pfSubtle">{text}</p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row sm:items-center">
          <Link href={consultationHref ?? "/consultation"} className="btn-accent">
            Kostenlose Beratung buchen →
          </Link>
          <a href="tel:+4921928743999" className="btn-outline">
            Oder anrufen: 02192 8743999
          </a>
        </div>
      </div>
    </section>
  );
}
