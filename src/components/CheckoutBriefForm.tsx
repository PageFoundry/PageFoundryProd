"use client";
import { useI18n } from "@/i18n/useI18n";
import { useState } from "react";
import type { ProductKey } from "@/lib/products";

type Brief = {
  website?: string;
  colors?: string[];
  texts?: string;
  images?: string[];
  notes?: string;
};

type BriefConfig = {
  requireWebsite: boolean;
  showColors: boolean;
  showTexts: boolean;
  showImages: boolean;
  showNotes: boolean;
};

const DEFAULT_CONFIG: BriefConfig = {
  requireWebsite: false,
  showColors: true,
  showTexts: true,
  showImages: true,
  showNotes: true,
};

// Produkte bei denen eine URL zwingend notwendig ist
const PRODUCT_CONFIG: Partial<Record<ProductKey, Partial<BriefConfig>>> = {
  landing_page_hosting: { requireWebsite: true },
  seo_basic: { requireWebsite: true },
  seo_advanced: { requireWebsite: true },
  speed_opt: { requireWebsite: true },
  maintenance: { requireWebsite: true },
  request_offer: { requireWebsite: true },
};

export default function CheckoutBriefForm({
  productId,
  productKey,
}: {
  productId: string;
  productKey?: ProductKey;
}) {
  const { t } = useI18n();

  const [website, setWebsite] = useState("");
  const [colors, setColors] = useState("");
  const [texts, setTexts] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cfg: BriefConfig = {
    ...DEFAULT_CONFIG,
    ...(productKey ? PRODUCT_CONFIG[productKey] : {}),
  };

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

      const urls = (data.urls ?? []) as string[];
      setImages(prev =>
        [...prev, ...urls.map(u => (u.startsWith("/") ? u : "/" + u))]
      );
    } catch (e: any) {
      setErr(e?.message || "Upload error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function startCheckout() {
    setErr(null);

    if (cfg.requireWebsite && !website.trim()) {
      setErr(t("checkoutBrief.websiteRequired"));
      return;
    }

    setBusy(true);
    try {
      const brief: Brief = {};

      if (cfg.requireWebsite) brief.website = website.trim();
      if (cfg.showColors)
        brief.colors = colors
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);
      if (cfg.showTexts && texts) brief.texts = texts;
      if (cfg.showImages && images.length) brief.images = images;
      if (cfg.showNotes && notes) brief.notes = notes;

      const res = await fetch("/api/stripe/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, brief }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Checkout failed");

      window.location.href = data.url;
    } catch (e: any) {
      setErr(e?.message || "Checkout error");
    } finally {
      setBusy(false);
    }
  }

  const labelClass = "font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted";

  return (
    <div className="mt-6 flex flex-col gap-5">
      {/* Website URL */}
      {cfg.requireWebsite && (
        <div className="flex flex-col gap-1">
          <label className={labelClass}>{t("checkoutBrief.website")}</label>
          <input
            className="pf-input"
            placeholder={t("checkoutBrief.websitePH")}
            value={website}
            onChange={e => setWebsite(e.target.value)}
          />
        </div>
      )}

      {/* Colors */}
      {cfg.showColors && (
        <div className="flex flex-col gap-1">
          <label className={labelClass}>{t("checkoutBrief.colors")}</label>
          <input
            className="pf-input"
            value={colors}
            onChange={e => setColors(e.target.value)}
            placeholder="#FF7518, #111111"
          />
        </div>
      )}

      {/* Texts */}
      {cfg.showTexts && (
        <div className="flex flex-col gap-1">
          <label className={labelClass}>{t("checkoutBrief.texts")}</label>
          <textarea
            className="pf-input resize-none"
            rows={3}
            value={texts}
            onChange={e => setTexts(e.target.value)}
            placeholder={t("checkoutBrief.textsPH")}
          />
        </div>
      )}

      {/* Upload */}
      {cfg.showImages && (
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t("checkoutBrief.upload")}</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="block w-full text-xs text-pfSubtle font-mono file:mr-3 file:py-1 file:px-3 file:border file:border-pfBorderMid file:bg-pfSurface file:text-pfSubtle file:text-xs file:font-mono file:rounded-sm file:cursor-pointer hover:file:border-pfBorderAccent"
          />
          {uploading && (
            <p className="text-xs text-pfMuted font-mono tracking-widest">{t("checkoutBrief.uploading")}</p>
          )}
          {images.length > 0 && (
            <div className="mt-1 grid grid-cols-3 gap-2">
              {images.map(u => (
                <a
                  key={u}
                  href={u}
                  target="_blank"
                  className="block border border-pfBorderMid rounded-sm overflow-hidden hover:border-pfBorderAccent transition-colors"
                >
                  <img
                    src={
                      u.startsWith("/")
                        ? u
                        : u.startsWith("uploads/")
                        ? "/" + u
                        : "/uploads/" + u
                    }
                    alt="upload"
                    className="w-full h-20 object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {cfg.showNotes && (
        <div className="flex flex-col gap-1">
          <label className={labelClass}>{t("checkoutBrief.notes")}</label>
          <textarea
            className="pf-input resize-none"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t("checkoutBrief.notesPH")}
          />
        </div>
      )}

      {err && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-sm px-3 py-2 font-mono">
          {err}
        </div>
      )}

      <button
        onClick={startCheckout}
        disabled={busy || uploading}
        className="btn-accent justify-center disabled:opacity-40 disabled:cursor-wait"
      >
        {busy ? "Redirecting…" : t("checkoutBrief.button")}
      </button>
    </div>
  );
}
