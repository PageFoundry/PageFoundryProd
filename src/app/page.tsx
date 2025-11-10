import PackageCard from "@/components/PackageCard";
import { productOrderKeys } from "@/lib/products";


export default function LandingPage() {
return (
<section className="relative z-10 px-6 py-16 text-white">
<div className="mx-auto flex max-w-screen-xl flex-col gap-16">
{/* HERO */}
<div className="fade-in flex flex-col items-start gap-8 text-left md:max-w-2xl">
<div className="inline-flex items-center gap-2 rounded-full border border-pfOrange/40 bg-pfOrange/10 px-3 py-1 text-[10px] font-semibold text-pfOrange">
CONVERSION FIRST
</div>
<h1 className="text-3xl font-semibold leading-[1.1] text-white md:text-5xl">
Landing Pages, Hosting, SEO, Speed. Built to convert.
</h1>
<p className="text-base text-zinc-400 md:text-lg leading-relaxed">
High-performing web presence. Clean infrastructure. No bullshit retainers.
</p>
<div className="flex flex-col sm:flex-row gap-4 text-sm font-semibold">
<button className="rounded-full bg-pfOrange px-5 py-3 text-black hover:brightness-110">
Free Consultation
</button>
<a
href="#packages"
className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-white hover:bg-white/10"
>
See Packages
</a>
</div>
</div>


{/* PACKAGES GRID */}
<div id="packages" className="fade-in grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
{productOrderKeys.map((id) => (
<PackageCard key={id} id={id} />
))}
</div>


{/* TRUST / VALUE SECTION */}
<div className="fade-in grid gap-6 lg:grid-cols-3">
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
<div className="text-pfOrange text-sm font-semibold mb-2">SEO BASIC → ADVANCED</div>
<div className="text-white text-lg font-medium leading-tight">
Better visibility. Cleaner structure. Real search intent.
</div>
<div className="text-zinc-400 text-sm leading-relaxed mt-3">
We fix indexability, Core Web Vitals, and content hierarchy so Google actually understands you.
</div>
</div>
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
<div className="text-pfOrange text-sm font-semibold mb-2">99% MOBILE FIRST</div>
<div className="text-white text-lg font-medium leading-tight">
Designed for the thumb not the mouse.
</div>
<div className="text-zinc-400 text-sm leading-relaxed mt-3">
Most traffic is mobile. Layout, tap targets, load time, clarity. All tuned for that reality.
</div>
</div>
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
<div className="text-pfOrange text-sm font-semibold mb-2">SPEED OPTIMIZATION</div>
<div className="text-white text-lg font-medium leading-tight">
Faster sites convert higher and rank higher.
</div>
<div className="text-zinc-400 text-sm leading-relaxed mt-3">
We remove bloat, lazy-load assets, compress media, and stabilize CLS. Users stay. Bounce drops.
</div>
</div>
</div>
</div>
</section>
);
}