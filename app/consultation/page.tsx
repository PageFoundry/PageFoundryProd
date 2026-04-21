"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/useI18n";
import type { ConsultationType } from "@prisma/client";

type ApiSlot = {
  id: string;
  start: string;
  end: string;
  label: string;
};

type AllowedDate = {
  value: string; // YYYY-MM-DD
  label: string;
};

const TIMEZONE = "Europe/Berlin";
const ALLOWED_WEEKDAYS = [1, 3, 4];
const MAX_DAYS_AHEAD = 14;

function formatDateValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeAllowedDates(): AllowedDate[] {
  const today = new Date();
  const out: AllowedDate[] = [];

  for (let i = 0; i < MAX_DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    if (!ALLOWED_WEEKDAYS.includes(dow)) continue;

    out.push({
      value: formatDateValue(d),
      label: d.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    });
  }
  return out;
}

const CONSULTATION_TYPE_OPTIONS: { value: ConsultationType; label: string }[] = [
  { value: "LANDING_PAGE", label: "Landing Page Beratung" },
  { value: "SEO_AUDIT", label: "SEO / Technical Audit" },
  { value: "CONTENT_COPY", label: "Content & Copywriting" },
  { value: "ECOMMERCE_OPTIMIZATION", label: "E-Commerce Optimierung" },
  { value: "FULL_SITE_REVIEW", label: "Full-Website Assessment" },
  { value: "CONVERSION_OPT", label: "Conversion-Optimierung" },
  { value: "SYSTEMS_AUTOMATION", label: "Systeme & Automatisierung" },
  { value: "SPEED_AUDIT", label: "Performance & Speed Audit" },
];

export default function ConsultationPage() {
  const { t } = useI18n();

  const allowedDates = useMemo(() => computeAllowedDates(), []);
  const [date, setDate] = useState<string>(
    () => allowedDates[0]?.value ?? formatDateValue(new Date())
  );

  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [participants, setParticipants] = useState(1);
  const [consultationType, setConsultationType] =
    useState<ConsultationType>("FULL_SITE_REVIEW");

  const [ok, setOk] = useState<null | string>(null);
  const [err, setErr] = useState<null | string>(null);
  const [submitting, setSubmitting] = useState(false);

  const dateLabel = useMemo(() => {
    const d = allowedDates.find((ad) => ad.value === date);
    return d?.label ?? "";
  }, [allowedDates, date]);

  async function loadSlots(d: string) {
    if (!d) return;
    setSlots([]);
    setSlotId(null);
    setSlotsError(null);
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/consultation/slots?date=${d}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load slots");
      const list = (data.slots ?? []) as ApiSlot[];
      setSlots(list);
      if (list.length > 0) setSlotId(list[0].id);
      if (list.length === 0) setSlotsError(t("consultation.noSlots"));
    } catch {
      setSlotsError(t("consultation.noSlots"));
    } finally {
      setSlotsLoading(false);
    }
  }

  useEffect(() => {
    if (date) loadSlots(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);

    if (!slotId) { setErr(t("consultation.noSlots")); return; }
    if (!note.trim()) { setErr(t("consultation.notesRequired")); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, note, slotId, participants, consultationType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to submit");
      setOk(t("consultation.ok"));
      setErr(null);
    } catch {
      setErr(t("consultation.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section-pad">
      <div className="max-w-screen-xl mx-auto fade-in">

        {/* Header */}
        <div className="border-b border-pfBorder pb-8 mb-12">
          <span className="label-mono block mb-4">Free Consultation</span>
          <h1
            className="leading-none text-pfText"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 8vw, 5.5rem)",
            }}
          >
            {t("consultation.title")}
          </h1>
          <p className="text-pfSubtle text-sm mt-3">{t("consultation.subtitle")}</p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="pf-card p-6">
            <form onSubmit={submit} className="flex flex-col gap-6">

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.name")}
                </label>
                <input
                  required
                  className="pf-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.email")}
                </label>
                <input
                  required
                  type="email"
                  className="pf-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.phone")}
                </label>
                <input
                  required
                  className="pf-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 ..."
                />
              </div>

              {/* Date selection */}
              <div>
                <span className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted block mb-3">
                  {t("consultation.preferred")} ({TIMEZONE})
                </span>
                {allowedDates.length === 0 ? (
                  <p className="text-pfMuted font-mono text-xs">{t("consultation.noDates")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allowedDates.map((d) => {
                      const selected = d.value === date;
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setDate(d.value)}
                          className={`px-3 py-1 border text-xs font-mono rounded-sm transition-colors ${
                            selected
                              ? "border-pfBorderAccent bg-pfAccentDim text-pfAccent"
                              : "border-pfBorder bg-pfSurface text-pfSubtle hover:border-pfBorderMid hover:text-pfText"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Time slot */}
              <div className="flex flex-col gap-1">
                {slotsLoading ? (
                  <p className="text-pfMuted font-mono text-xs tracking-widest">
                    {t("consultation.loadingSlots")}
                  </p>
                ) : slots.length === 0 ? (
                  <p className="text-pfMuted font-mono text-xs">
                    {slotsError || t("consultation.noSlots")}
                  </p>
                ) : (
                  <>
                    <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                      {t("consultation.timeOfDay")}
                    </label>
                    <select
                      className="pf-input"
                      value={slotId ?? ""}
                      onChange={(e) => setSlotId(e.target.value)}
                    >
                      {slots.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>

              {/* Participants */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.participants")}
                </label>
                <select
                  className="pf-input"
                  value={participants}
                  onChange={(e) => setParticipants(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Consultation type */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.typeOfConsultation")}
                </label>
                <select
                  className="pf-input"
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value as ConsultationType)}
                >
                  {CONSULTATION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.notesLabel")}
                </label>
                <textarea
                  required
                  className="pf-input resize-none"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("consultation.notesPlaceholder") || "Kurze Beschreibung Ihres Projekts…"}
                />
              </div>

              {ok && (
                <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-sm px-3 py-2 font-mono">
                  {ok}
                </div>
              )}
              {err && (
                <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-sm px-3 py-2 font-mono">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || slotsLoading || !slotId}
                className="btn-accent justify-center disabled:opacity-40 disabled:cursor-wait"
              >
                {submitting ? t("consultation.submitting") : `${t("consultation.book")} →`}
              </button>

            </form>
          </div>
        </div>

      </div>
    </section>
  );
}
