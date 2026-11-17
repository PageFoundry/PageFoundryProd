import Image from "next/image";
import Link from "next/link";

export default function TheLoftExampleLink() {
  return (
    <Link href="/projekte/the-loft#mobiler-vergleich" className="group inline-flex max-w-lg items-center gap-4 border-y border-pfBorder py-3 text-pfText hover:border-pfAccent">
      <Image src="/work/the-loft-interior-detail.webp" alt="" width={480} height={360} sizes="(min-width: 640px) 112px, 88px" className="h-auto w-[5.5rem] shrink-0 sm:w-28" />
      <span>
        <span className="block font-medium">The Loft in Wuppertal</span>
        <span className="block leading-6 text-pfSubtle">So finden Gäste die Speisekarte und Brunchzeiten auf dem Handy.</span>
        <span className="text-pfAccent underline underline-offset-4">Vorher und nachher ansehen</span>
      </span>
    </Link>
  );
}
