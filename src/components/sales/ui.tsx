"use client";

import { useState } from "react";

export const inputClass =
  "w-full rounded-sm border border-pfBorder bg-pfBg px-3 py-2 text-sm text-pfText placeholder:text-pfMuted focus:border-pfAccent focus:outline-none";
export const cardClass = "rounded-sm border border-pfBorder bg-pfCard p-5";
export const mono = { fontFamily: "var(--font-mono)" } as const;
export const labelClass = "block text-xs text-pfSubtle";

export const dateTimeFmt = new Intl.DateTimeFormat("de-DE", {
  weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin",
});
export const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });

export async function sendJson(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.message || "Fehler"), { status: res.status, code: data?.code });
  return data;
}

export function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "success" | "danger" }) {
  const cls = {
    muted: "border-pfBorder text-pfSubtle",
    accent: "border-pfBorderAccent text-pfAccent",
    success: "border-pfSuccess text-pfSuccess",
    danger: "border-pfDanger text-pfDanger",
  }[tone];
  return (
    <span className={`inline-block shrink-0 rounded-sm border px-2 py-1 text-[0.6rem] uppercase tracking-widest ${cls}`} style={mono}>
      {children}
    </span>
  );
}

export function CopyButton({ value, label = "Kopieren" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="rounded-sm border border-pfBorder px-3 py-2 text-[0.62rem] uppercase tracking-widest text-pfSubtle hover:border-pfBorderAccent hover:text-pfAccent"
      style={mono}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* Clipboard nicht verfuegbar */
        }
      }}
    >
      {copied ? "Kopiert" : label}
    </button>
  );
}

export function Choice<T extends string>({
  value, options, onChange, name,
}: { value: T | undefined; options: Array<{ value: T; label: string; hint?: string }>; onChange: (v: T) => void; name: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-sm border px-3 py-3 text-left text-sm transition-colors ${
            value === o.value ? "border-pfBorderAccent bg-pfAccentDim text-pfAccent" : "border-pfBorder text-pfText hover:border-pfBorderAccent"
          }`}
        >
          {o.label}
          {o.hint && <span className="mt-1 block text-[0.7rem] text-pfMuted">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}
