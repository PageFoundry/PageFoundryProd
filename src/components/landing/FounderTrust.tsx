import Image from "next/image";

type Props = {
  copy: {
    label: string;
    heading: string;
    text: string;
    quote: string;
    role: string;
    imageAlt: string;
    location: string;
    locationLabel: string;
    phoneLabel: string;
    emailLabel: string;
  };
};

export default function FounderTrust({ copy }: Props) {
  return (
    <section className="px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto grid max-w-screen-xl overflow-hidden border border-pfBorder bg-pfCard lg:grid-cols-[0.72fr_1.28fr]">
        <div className="relative min-h-[22rem] overflow-hidden border-b border-pfBorder md:min-h-[30rem] lg:min-h-[42rem] lg:border-b-0 lg:border-r">
          <Image
            src="/work/fabian-franke.png"
            alt={copy.imageAlt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/45 to-transparent px-7 pb-7 pt-24">
            <p className="font-display text-4xl leading-none text-pfText">Fabian Franke</p>
            <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-pfAccent">{copy.role}</p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 md:p-12 lg:p-16">
          <span className="label-mono">{copy.label}</span>
          <h2 className="mt-5 max-w-3xl font-display text-4xl leading-[0.95] text-pfText md:mt-6 md:text-7xl">{copy.heading}</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-pfSubtle md:mt-7 md:text-lg md:leading-8">{copy.text}</p>

          <blockquote className="mt-7 border-l-2 border-pfAccent pl-5 font-display text-2xl leading-tight text-pfText md:mt-10 md:pl-6 md:text-4xl">
            “{copy.quote}”
          </blockquote>

          <div className="mt-8 grid gap-px bg-pfBorder sm:grid-cols-3 md:mt-12">
            <div className="bg-pfSurface p-4 md:p-5">
              <p className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-pfMuted">{copy.locationLabel}</p>
              <p className="mt-2 text-sm text-pfText">{copy.location}</p>
            </div>
            <a href="tel:+4921928743999" className="bg-pfSurface p-4 transition-colors hover:bg-pfCardHover md:p-5">
              <p className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-pfMuted">{copy.phoneLabel}</p>
              <p className="mt-2 text-sm text-pfText">+49 2192 8743999</p>
            </a>
            <a href="mailto:admin@pagefoundry.de" className="bg-pfSurface p-4 transition-colors hover:bg-pfCardHover md:p-5">
              <p className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-pfMuted">{copy.emailLabel}</p>
              <p className="mt-2 break-all text-sm text-pfText">admin@pagefoundry.de</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
