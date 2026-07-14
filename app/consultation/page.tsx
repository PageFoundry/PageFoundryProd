"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/useI18n";
import type { ConsultationType } from "@prisma/client";
import {
  ALLOWED_WEEKDAYS,
  END_HOUR,
  MAX_DAYS_AHEAD,
  SLOT_MINUTES,
  TIMEZONE,
  berlinParts,
  berlinWallClockToUtc,
  earliestBookableStart,
} from "@/lib/consultation/policy";
import { productOrderKeys, type ProductKey } from "@/lib/products";

type ApiSlot = {
  id: string;
  start: string;
  end: string;
  label: string;
};

type AllowedDate = {
  value: string; // YYYY-MM-DD (Berliner Kalendertag)
  label: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// Buchbare Tage in Europe/Berlin berechnen — nicht in der Browser-Zeitzone.
// Sonst fragen Besucher ausserhalb der Berliner Zeitzone falsche Tage an.
function computeAllowedDates(locale: string, now: Date = new Date()): AllowedDate[] {
  const out: AllowedDate[] = [];
  const earliest = earliestBookableStart(now);
  const today = berlinParts(now);
  const labelFormat = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIMEZONE,
  });

  // Erst ab morgen: Termine brauchen 24 h Vorlauf (siehe lib/consultation/policy).
  for (let i = 1; i <= MAX_DAYS_AHEAD; i++) {
    // Date.UTC normalisiert Monats-/Jahresueberlaeufe des Tages-Offsets.
    const dayUtc = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
    const y = dayUtc.getUTCFullYear();
    const m = dayUtc.getUTCMonth();
    const d = dayUtc.getUTCDate();
    if (!ALLOWED_WEEKDAYS.includes(dayUtc.getUTCDay())) continue;

    // Tage, an denen selbst der letzte Slot den Vorlauf reißt, gar nicht erst anbieten —
    // sonst zeigt der Chip nur "keine freien Termine". Betrifft abends den Folgetag.
    const lastSlotStart = new Date(
      berlinWallClockToUtc(y, m, d, END_HOUR, 0).getTime() - SLOT_MINUTES * 60_000
    );
    if (lastSlotStart < earliest) continue;

    out.push({
      value: `${y}-${pad2(m + 1)}-${pad2(d)}`,
      label: labelFormat.format(berlinWallClockToUtc(y, m, d, 12, 0)),
    });
  }
  return out;
}

const CONSULTATION_TYPES: ConsultationType[] = [
  "LANDING_PAGE",
  "SEO_AUDIT",
  "CONTENT_COPY",
  "ECOMMERCE_OPTIMIZATION",
  "FULL_SITE_REVIEW",
  "CONVERSION_OPT",
  "SYSTEMS_AUTOMATION",
  "SPEED_AUDIT",
];

// Sinnvolle Vorauswahl der Beratungsart je angefragtem Paket (frei aenderbar).
const PACKAGE_TO_TYPE: Partial<Record<ProductKey, ConsultationType>> = {
  landing_page: "LANDING_PAGE",
  landing_page_hosting: "LANDING_PAGE",
  all_inclusive: "LANDING_PAGE",
  seo_basic: "SEO_AUDIT",
  seo_advanced: "SEO_AUDIT",
  speed_opt: "SPEED_AUDIT",
};

type FieldErrors = {
  name?: string;
  email?: string;
  slot?: string;
};

export default function ConsultationPage() {
  const { t, lang } = useI18n();
  const locale = lang === "de" ? "de-DE" : "en-US";

  const allowedDates = useMemo(() => computeAllowedDates(locale), [locale]);
  const [date, setDate] = useState<string>(() => allowedDates[0]?.value ?? "");

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
  const [packageKey, setPackageKey] = useState<ProductKey | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<null | string>(null);
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<HTMLSelectElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Vorausgewaehltes Paket aus ?package= (kommt von den Paket-CTAs der Startseite).
  // Bewusst im Effect statt ueber useSearchParams: kein Suspense-Zwang, kein Mismatch.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("package");
    if (raw && (productOrderKeys as string[]).includes(raw)) {
      const key = raw as ProductKey;
      setPackageKey(key);
      const mapped = PACKAGE_TO_TYPE[key];
      if (mapped) setConsultationType(mapped);
    }
  }, []);

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
      const timeFormat = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: TIMEZONE,
      });
      const list = ((data.slots ?? []) as ApiSlot[]).map((slot) => ({
        ...slot,
        label: `${timeFormat.format(new Date(slot.start))}–${timeFormat.format(new Date(slot.end))} (${TIMEZONE})`,
      }));
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

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = t("consultation.errors.name");
    const emailTrimmed = email.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = t("consultation.errors.email");
    }
    if (!slotId) errors.slot = t("consultation.errors.slot");
    return errors;
  }

  function focusFirstError(errors: FieldErrors) {
    if (errors.name) nameRef.current?.focus();
    else if (errors.email) emailRef.current?.focus();
    else if (errors.slot) (slotRef.current ?? errorSummaryRef.current)?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Fokus auf das erste fehlerhafte Feld, Zusammenfassung ist role=alert.
      focusFirstError(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          note,
          slotId,
          participants,
          consultationType,
          ...(packageKey ? { packageKey } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to submit");
      setOk(true);
      setErr(null);
    } catch {
      setErr(t("consultation.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  // Nach Erfolg den Fokus auf die Bestaetigung setzen (Screenreader + Tastatur).
  useEffect(() => {
    if (ok) successRef.current?.focus();
  }, [ok]);

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return (
    <section className="section-pad">
      <div className="max-w-screen-xl mx-auto fade-in">

        {/* Header */}
        <div className="border-b border-pfBorder pb-8 mb-12">
          <span className="label-mono block mb-4">{t("consultation.eyebrow")}</span>
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
          <p className="text-pfMuted text-xs font-mono mt-2 tracking-wide">
            {t("consultation.phoneHint")}{" "}
            <a href="tel:+4921928743999" className="text-pfAccent">
              +49 2192 8743999
            </a>{" "}
            {t("consultation.phoneHintSuffix")}
          </p>
        </div>

        <div className="max-w-lg mx-auto">

          {/* Terminart, Dauer, Zeitzone, Kosten — aus den echten Systemdaten. */}
          <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 border border-pfBorder rounded-xl bg-pfCard p-5 text-sm">
            <div>
              <dt className="font-mono text-[0.6rem] tracking-widest uppercase text-pfMuted">
                {t("consultation.meta.typeLabel")}
              </dt>
              <dd className="text-pfText mt-0.5">{t("consultation.meta.typeValue")}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.6rem] tracking-widest uppercase text-pfMuted">
                {t("consultation.meta.durationLabel")}
              </dt>
              <dd className="text-pfText mt-0.5">
                {t("consultation.meta.durationValue", { minutes: SLOT_MINUTES })}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.6rem] tracking-widest uppercase text-pfMuted">
                {t("consultation.meta.timezoneLabel")}
              </dt>
              <dd className="text-pfText mt-0.5">{TIMEZONE}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.6rem] tracking-widest uppercase text-pfMuted">
                {t("consultation.meta.costLabel")}
              </dt>
              <dd className="text-pfText mt-0.5">{t("consultation.meta.costValue")}</dd>
            </div>
          </dl>

          {packageKey && !ok && (
            <div className="mb-6 flex items-center justify-between gap-4 border border-pfBorderAccent bg-pfAccentDim rounded-xl px-5 py-4">
              <p className="text-sm text-pfText">
                <span className="font-mono text-[0.6rem] tracking-widest uppercase text-pfAccent block mb-1">
                  {t("consultation.packageBanner")}
                </span>
                {t(`products.${packageKey}.title`)}
              </p>
              <button
                type="button"
                onClick={() => setPackageKey(null)}
                className="shrink-0 font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted hover:text-pfAccent transition-colors px-2 py-2"
              >
                {t("consultation.packageRemove")}
              </button>
            </div>
          )}

          {ok ? (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="pf-card p-6 outline-none"
            >
              <h2 className="font-display text-3xl leading-none text-pfText mb-4">
                {t("consultation.success.title")}
              </h2>
              <p className="text-sm text-pfSubtle leading-7 mb-4">{t("consultation.ok")}</p>
              <p className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted mb-2">
                {t("consultation.success.nextLabel")}
              </p>
              <ol className="list-decimal list-inside text-sm text-pfSubtle leading-7">
                <li>{t("consultation.success.next1")}</li>
                <li>{t("consultation.success.next2")}</li>
                <li>{t("consultation.success.next3")}</li>
              </ol>
            </div>
          ) : (
          <div className="pf-card p-6">
            <form onSubmit={submit} noValidate className="flex flex-col gap-6">

              <p className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                {t("consultation.requiredLegend")}
              </p>

              {hasErrors && (
                <div
                  ref={errorSummaryRef}
                  role="alert"
                  tabIndex={-1}
                  className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-sm px-3 py-2 font-mono"
                >
                  <p className="mb-1 font-bold">{t("consultation.errors.summary")}</p>
                  <ul className="list-disc list-inside">
                    {fieldErrors.name && <li>{fieldErrors.name}</li>}
                    {fieldErrors.email && <li>{fieldErrors.email}</li>}
                    {fieldErrors.slot && <li>{fieldErrors.slot}</li>}
                  </ul>
                </div>
              )}

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label htmlFor="c-name" className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.name")} *
                </label>
                <input
                  id="c-name"
                  ref={nameRef}
                  required
                  aria-required="true"
                  aria-invalid={fieldErrors.name ? true : undefined}
                  aria-describedby={fieldErrors.name ? "c-name-error" : undefined}
                  className="pf-input"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                />
                {fieldErrors.name && (
                  <p id="c-name-error" className="text-xs text-red-400 font-mono">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label htmlFor="c-email" className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.email")} *
                </label>
                <input
                  id="c-email"
                  ref={emailRef}
                  required
                  aria-required="true"
                  aria-invalid={fieldErrors.email ? true : undefined}
                  aria-describedby={fieldErrors.email ? "c-email-error" : undefined}
                  type="email"
                  autoComplete="email"
                  className="pf-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                {fieldErrors.email && (
                  <p id="c-email-error" className="text-xs text-red-400 font-mono">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone (optional) */}
              <div className="flex flex-col gap-1">
                <label htmlFor="c-phone" className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.phoneOptional")}
                </label>
                <input
                  id="c-phone"
                  type="tel"
                  autoComplete="tel"
                  className="pf-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 ..."
                />
                <p className="text-xs text-pfMuted">{t("consultation.phoneHelp")}</p>
              </div>

              {/* Date selection */}
              <fieldset>
                <legend className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted block mb-3">
                  {t("consultation.preferred")} *
                </legend>
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
                          aria-pressed={selected}
                          onClick={() => setDate(d.value)}
                          className={`px-3 py-2 border text-xs font-mono rounded-sm transition-colors ${
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
              </fieldset>

              {/* Time slot */}
              <div className="flex flex-col gap-1">
                {slotsLoading ? (
                  <p className="text-pfMuted font-mono text-xs tracking-widest" role="status">
                    {t("consultation.loadingSlots")}
                  </p>
                ) : slots.length === 0 ? (
                  <p className="text-pfMuted font-mono text-xs">
                    {slotsError || t("consultation.noSlots")}
                  </p>
                ) : (
                  <>
                    <label htmlFor="c-slot" className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                      {t("consultation.timeOfDay")} *
                    </label>
                    <select
                      id="c-slot"
                      ref={slotRef}
                      required
                      aria-required="true"
                      aria-invalid={fieldErrors.slot ? true : undefined}
                      aria-describedby={fieldErrors.slot ? "c-slot-error" : undefined}
                      className="pf-input"
                      value={slotId ?? ""}
                      onChange={(e) => setSlotId(e.target.value)}
                    >
                      {slots.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                    {fieldErrors.slot && (
                      <p id="c-slot-error" className="text-xs text-red-400 font-mono">{fieldErrors.slot}</p>
                    )}
                  </>
                )}
              </div>

              {/* Participants */}
              <div className="flex flex-col gap-1">
                <label htmlFor="c-participants" className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.participants")}
                </label>
                <select
                  id="c-participants"
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
                <label htmlFor="c-type" className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.typeOfConsultation")}
                </label>
                <select
                  id="c-type"
                  className="pf-input"
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value as ConsultationType)}
                >
                  {CONSULTATION_TYPES.map((value) => (
                    <option key={value} value={value}>{t(`consultation.types.${value}`)}</option>
                  ))}
                </select>
              </div>

              {/* Notes (optional) */}
              <div className="flex flex-col gap-1">
                <label htmlFor="c-note" className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("consultation.notesLabel")}
                </label>
                <textarea
                  id="c-note"
                  className="pf-input resize-none"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("consultation.notesPlaceholder")}
                />
              </div>

              {err && (
                <div role="alert" className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-sm px-3 py-2 font-mono">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || slotsLoading}
                className="btn-accent justify-center disabled:opacity-40 disabled:cursor-wait"
              >
                {submitting ? t("consultation.submitting") : `${t("consultation.book")} →`}
              </button>

            </form>
          </div>
          )}
        </div>

      </div>
    </section>
  );
}
