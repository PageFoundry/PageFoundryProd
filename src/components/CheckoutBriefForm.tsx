"use client";

import { useState } from "react";

type Brief = {
  colors?: string[];
  texts?: string;
  images?: string[]; // URLs (manuell oder via Upload-API erzeugt)
  notes?: string;
};

export default function CheckoutBriefForm({ productId }: { productId: string }) {
  const [colors, setColors] = useState("");
  const [texts, setTexts] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files.length) return;
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of Array.from(e.target.files)) fd.append("files", f);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");
      setImages(prev => [...prev, ...data.urls]);
    } catch (e: any) {
      setErr(e?.message || "Upload error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function startCheckout() {
    setErr(null);
    setBusy(true);
    try {
      const brief: Brief = {
        colors: colors.split(",").map(s=>s.trim()).filter(Boolean),
        texts: texts || undefined,
        images: images.length ? images : undefined,
        notes: notes || undefined,
      };
      const res = await fetch("/api/stripe/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, brief }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else throw new Error(data?.error || "Checkout failed");
    } catch (e:any) {
      setErr(e?.message || "Checkout error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <label className="block text-xs text-zinc-400">Farben (HEX, komma-getrennt)</label>
        <input className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1"
               value={colors} onChange={e=>setColors(e.target.value)} placeholder="#FF7518, #111111" />
      </div>

      <div>
        <label className="block text-xs text-zinc-400">Texte / Stichworte</label>
        <textarea className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1"
                  rows={3} value={texts} onChange={e=>setTexts(e.target.value)}
                  placeholder="Headlines, Claims, CTA, Zielgruppe..." />
      </div>

      <div>
        <label className="block text-xs text-zinc-400">Bilder hochladen (png, jpg, webp, avif; ≤5MB)</label>
        <input type="file" multiple accept="image/*" onChange={handleUpload}
               className="block w-full text-xs text-zinc-300" />
        {uploading && <div className="text-xs text-zinc-400 mt-1">Upload läuft…</div>}
        {images.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {images.map((u)=>(
              <a key={u} href={u} target="_blank" className="block border border-white/10 rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="upload" className="w-full h-20 object-cover" />
              </a>
            ))}
          </div>
        )}
        <div className="text-[11px] text-zinc-500 mt-1">Oder Bild-Links direkt in “Texte”/unten in Notizen einfügen.</div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400">Notizen</label>
        <textarea className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1"
                  rows={2} value={notes} onChange={e=>setNotes(e.target.value)} />
      </div>

      {err && <div className="text-red-400 text-xs">{err}</div>}

      <button onClick={startCheckout} disabled={busy || uploading}
              className="w-full rounded-full bg-pfOrange px-4 py-3 text-black text-sm font-semibold hover:brightness-110 disabled:opacity-50">
        {busy ? "Redirecting…" : "Mit Stripe fortfahren"}
      </button>
    </div>
  );
}
