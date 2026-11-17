import Image from "next/image";
import Link from "next/link";

export default function TheLoftExampleLink() {
  return (
    <Link href="/projekte/the-loft#mobiler-vergleich" className="group inline-flex max-w-lg items-center gap-4 border border-pfBorder bg-pfCard p-3 text-pfText hover:border-pfAccent">
      <Image src="/work/the-loft-mobile-speisekarte-nachher.webp" alt="" width={381} height={320} sizes="96px" className="h-auto w-20 shrink-0 sm:w-24" />
      <span>
        <span className="block font-medium">The Loft in Wuppertal</span>
        <span className="block leading-6 text-pfSubtle">So finden Gäste die Speisekarte und Brunchzeiten auf dem Handy.</span>
        <span className="text-pfAccent underline underline-offset-4">Vorher und nachher ansehen</span>
      </span>
    </Link>
  );
}
