import Link from "next/link";

interface Props {
  heading: string;
  text: string;
}

export default function ServiceCTA({ heading, text }: Props) {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:px-10">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pfAccentDim md:h-[36rem] md:w-[36rem]" />
      <div className="relative mx-auto max-w-screen-xl">
        <span className="label-mono mb-5 block">Nächster Schritt</span>
        <h2 className="max-w-3xl font-display text-5xl leading-none text-pfText md:text-7xl">{heading}</h2>
        <p className="mt-6 max-w-2xl text-base leading-8 text-pfSubtle">{text}</p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link href="/consultation" className="btn-accent">
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
