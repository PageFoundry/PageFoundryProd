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
};

type Props = {
  cases: readonly CaseStudy[];
  labels: {
    caseFile: string;
    problem: string;
    delivery: string;
    result: string;
    visit: string;
    liveProject: string;
  };
};

export default function CaseStudyShowcase({ cases, labels }: Props) {
  return (
    <div className="mt-14 space-y-6">
      {cases.map((item, index) => (
        <article
          key={item.client}
          className={`group grid overflow-hidden border border-pfBorder bg-pfCard shadow-card ${
            index % 2 === 1
              ? "lg:grid-cols-[minmax(22rem,0.55fr)_minmax(0,1.45fr)]"
              : "lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.55fr)]"
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
            <div className="relative aspect-[3/2] overflow-hidden bg-pfSurface">
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="(min-width: 1024px) 68vw, 100vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.015] motion-reduce:transform-none"
              />
            </div>
            <div className="flex min-h-28 flex-1 items-end justify-between gap-6 border-t border-pfBorder bg-pfSurface p-6">
              <span className="font-display text-4xl leading-none text-pfText">{item.client}</span>
              <span className="text-right font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">
                {labels.liveProject}
              </span>
            </div>
          </div>

          <div className="flex flex-col p-7 md:p-10 lg:p-12">
            <div className="flex items-start justify-between gap-4 border-b border-pfBorder pb-6 font-mono text-[0.62rem] uppercase tracking-[0.18em]">
              <span className="text-pfAccent">{labels.caseFile} {String(index + 1).padStart(2, "0")}</span>
              <span className="text-right text-pfMuted">{item.date}</span>
            </div>

            <p className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-pfMuted">{item.scope}</p>
            <h3 className="mt-4 font-display text-5xl leading-[0.95] text-pfText md:text-6xl">{item.headline}</h3>

            <dl className="mt-10 divide-y divide-pfBorder border-y border-pfBorder">
              <div className="py-5">
                <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">{labels.problem}</dt>
                <dd className="mt-2 text-sm leading-7 text-pfSubtle">{item.problem}</dd>
              </div>
              <div className="py-5">
                <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">{labels.delivery}</dt>
                <dd className="mt-2 text-sm leading-7 text-pfSubtle">{item.delivery}</dd>
              </div>
            </dl>

            <div className="mt-6 border-l-2 border-pfAccent bg-pfAccentDim px-5 py-4">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">{labels.result}</p>
              <p className="mt-2 text-sm leading-7 text-pfText">{item.result}</p>
            </div>

            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline mt-8 self-start"
            >
              {labels.visit} ↗
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
