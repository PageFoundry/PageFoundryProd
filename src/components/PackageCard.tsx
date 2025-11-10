"use client";

import Link from "next/link";
import { ProductKey, productDisplayInfo } from "@/lib/products";

export default function PackageCard({ id }: { id: ProductKey }) {
  const data = productDisplayInfo[id];

  return (
    <div className="fade-in flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-card backdrop-blur-sm">
      <div className="flex flex-col gap-4">
        <div className="text-white font-semibold text-lg leading-tight">
          {data.title}
        </div>
        <div className="text-sm text-zinc-400 leading-relaxed">
          {data.desc}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div className="text-white text-base font-medium">{data.from}</div>

        <Link
          href={`/checkout/${id}`}
          className="rounded-full bg-pfOrange px-4 py-2 text-black text-sm font-semibold hover:brightness-110"
        >
          View / Order
        </Link>
      </div>
    </div>
  );
}
