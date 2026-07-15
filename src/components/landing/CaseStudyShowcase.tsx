import Image from "next/image";

export type CaseStudy = {
  client: string;
  date: string;
  domain: string;
  url: string;
  image: string;
  imageAlt: string;
  scope: string;
  headline: string;
  problem: string;
  delivery: string;
  result: string;
  evidenceSource: string;
  metrics: readonly {
    value: string;
    label: string;
    detail: string;
  }[];
  testimonial?: {
    quote: string;
    attribution: string;
  };
};

type Props = {
  cases: readonly CaseStudy[];
  labels: {
    caseFile: string;
    before: string;
    after: string;
    result: string;
    proof: string;
    visit: string;
    liveProject: string;
  };
};

export default function CaseStudyShowcase({ cases, labels }: Props) {
  return (
    <div className="mt-10 space-y-6 md:mt-14">
      {cases.map((item, index) => (
        <article
          key={item.client}
          className={`group grid overflow-hidden border border-pfBorder bg-pfCard shadow-card ${
            index % 2 === 1
              ? "lg:grid-cols-[minmax(28rem,0.8fr)_minmax(0,1.2fr)]"
              : "lg:grid-cols-[minmax(0,1.2fr)_minmax(28rem,0.8fr)]"
          }`}
        >
          <div className={`flex h-full flex-col ${index % 2 === 1 ? "lg:order-2" : ""}`}>
            <div className="flex h-11 items-center gap-2 border-b border-pfBorder bg-black px-4" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-pfAccent" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/10" />
              <span className="ml-3 truncate font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfMuted">
                {item.domain}
              </span>
            </div>
            <div className="relative aspect-[3/2] overflow-hidden bg-pfSurface lg:aspect-auto lg:min-h-[32rem] lg:flex-1">
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="(min-width: 1024px) 68vw, 100vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.015] motion-reduce:transform-none"
              />
            </div>
            <div className="flex min-h-20 items-end justify-between gap-6 border-t border-pfBorder bg-pfSurface p-5 md:min-h-28 md:p-6">
              <span className="font-display text-3xl leading-none text-pfText md:text-4xl">{item.client}</span>
              <span className="text-right font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">
                {labels.liveProject}
              </span>
            </div>
          </div>

          <div className="flex flex-col p-5 md:p-10 lg:p-12">
            <div className="flex items-start justify-between gap-4 border-b border-pfBorder pb-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] md:pb-6">
              <span className="text-pfAccent">{labels.caseFile} {String(index + 1).padStart(2, "0")}</span>
              <span className="text-right text-pfMuted">{item.date}</span>
            </div>

            <p className="mt-6 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-pfMuted md:mt-8">{item.scope}</p>
            <h3 className="mt-3 font-display text-4xl leading-[0.95] text-pfText md:mt-4 md:text-6xl">{item.headline}</h3>

            <dl className="mt-7 grid gap-px overflow-hidden border border-pfBorder bg-pfBorder sm:grid-cols-2 md:mt-10">
              <div className="bg-pfSurface p-4 md:p-5">
                <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">{labels.before}</dt>
                <dd className="mt-2 text-sm leading-6 text-pfSubtle md:leading-7">{item.problem}</dd>
              </div>
              <div className="bg-pfCard p-4 md:p-5">
                <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">{labels.after}</dt>
                <dd className="mt-2 text-sm leading-6 text-pfText md:leading-7">{item.delivery}</dd>
              </div>
            </dl>

            <div className="mt-5 overflow-hidden border border-pfBorder bg-pfSurface">
              <div className="flex items-center justify-between gap-4 border-b border-pfBorder px-4 py-3">
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">{labels.proof}</p>
                <p className="text-right font-mono text-[0.5rem] uppercase tracking-[0.14em] text-pfMuted">{item.evidenceSource}</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-pfBorder">
                {item.metrics.map((metric) => (
                  <div key={`${metric.value}-${metric.label}`} className="min-w-0 p-3 md:p-4">
                    <p className="font-display text-3xl leading-none text-pfText md:text-4xl">{metric.value}</p>
                    <p className="mt-2 font-mono text-[0.54rem] uppercase leading-4 tracking-[0.1em] text-pfAccent md:text-[0.56rem] md:tracking-[0.14em]">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-[0.68rem] leading-4 text-pfMuted md:text-xs md:leading-5">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-l-2 border-pfAccent bg-pfAccentDim px-4 py-3 md:px-5 md:py-4">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">{labels.result}</p>
              <p className="mt-2 text-sm leading-6 text-pfText md:leading-7">{item.result}</p>
            </div>

            {item.testimonial && (
              <blockquote className="mt-5 border-y border-pfBorder py-4">
                <p className="font-display text-2xl leading-tight text-pfText">“{item.testimonial.quote}”</p>
                <footer className="mt-2 font-mono text-[0.54rem] uppercase tracking-[0.16em] text-pfMuted">
                  {item.testimonial.attribution}
                </footer>
              </blockquote>
            )}

            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline mt-6 self-start md:mt-8"
            >
              {labels.visit} ↗
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
