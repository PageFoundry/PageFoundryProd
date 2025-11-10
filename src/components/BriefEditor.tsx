"use client";
import { useState } from "react";

type Brief = { colors?: string[]; texts?: string; images?: string[]; notes?: string };
export default function BriefEditor({ orderId, initial }: { orderId: string; initial?: Brief }) {
  const [colors, setColors] = useState((initial?.colors ?? []).join(", "));
  const [texts, setTexts]   = useState(initial?.texts ?? "");
  const [images, setImages] = useState((initial?.images ?? []).join(", "));
  const [notes, setNotes]   = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const brief: Brief = {
        colors: colors.split(",").map(s => s.trim()).filter(Boolean),
        texts,
        images: images.split(",").map(s => s.trim()).filter(Boolean),
        notes,
      };
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      if (!res.ok) throw new Error(await res.text());
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs text-zinc-400">Farben (HEX, komma-getrennt)</label>
      <input className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1" value={colors} onChange={e=>setColors(e.target.value)} />

      <label className="block text-xs text-zinc-400 mt-2">Texte (Stichworte)</label>
      <textarea className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1" rows={3} value={texts} onChange={e=>setTexts(e.target.value)} />

      <label className="block text-xs text-zinc-400 mt-2">Bild-URLs (komma-getrennt)</label>
      <input className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1" value={images} onChange={e=>setImages(e.target.value)} />

      <label className="block text-xs text-zinc-400 mt-2">Notizen</label>
      <textarea className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} />

      <button
        onClick={save}
        disabled={saving}
        className="mt-3 inline-flex items-center rounded-md bg-pfOrange px-3 py-1.5 text-black text-sm font-semibold disabled:opacity-50"
      >
        {saving ? "Speichere…" : "Brief speichern"}
      </button>
    </div>
  );
}
