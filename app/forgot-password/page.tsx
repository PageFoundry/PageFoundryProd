"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  return (
    <section className="section-pad flex min-h-screen items-start justify-center">
      <div className="pf-card w-full max-w-md p-7 sm:p-9">
        {sent ? (
          <div role="status" tabIndex={-1}>
            <span className="label-mono mb-5 block">E-Mail</span>
            <h1 className="font-display text-4xl leading-none text-pfText">{t("auth.reset.sentTitle")}</h1>
            <p className="mt-4 text-sm leading-7 text-pfSubtle">{t("auth.reset.sentText")}</p>
            <Link href="/login" className="btn-accent mt-7 justify-center">{t("auth.reset.backToLogin")}</Link>
          </div>
        ) : (
          <>
            <span className="label-mono mb-5 block">Kundenportal</span>
            <h1 className="font-display text-4xl leading-none text-pfText">{t("auth.reset.forgotTitle")}</h1>
            <p className="mt-4 text-sm leading-7 text-pfSubtle">{t("auth.reset.forgotSubtitle")}</p>
            <form onSubmit={submit} className="mt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <label htmlFor="reset-email" className="label-mono">{t("auth.reset.email")}</label>
                <input
                  id="reset-email"
                  className="pf-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <button type="submit" disabled={busy} className="btn-accent justify-center disabled:opacity-40">
                {busy ? "…" : `${t("auth.reset.send")} →`}
              </button>
            </form>
            <Link href="/login" className="mt-6 block text-center text-xs text-pfAccent">{t("auth.reset.backToLogin")}</Link>
          </>
        )}
      </div>
    </section>
  );
}
