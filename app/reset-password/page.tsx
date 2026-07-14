"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError(t("auth.reset.tooShort"));
    if (password !== confirm) return setError(t("auth.reset.mismatch"));
    if (!token) return setError(t("auth.reset.invalid"));

    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) throw new Error("invalid");
      setDone(true);
    } catch {
      setError(t("auth.reset.invalid"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section-pad flex min-h-screen items-start justify-center">
      <div className="pf-card w-full max-w-md p-7 sm:p-9">
        {done ? (
          <div role="status" tabIndex={-1}>
            <span className="label-mono mb-5 block">Kundenportal</span>
            <h1 className="font-display text-4xl leading-none text-pfText">{t("auth.reset.successTitle")}</h1>
            <p className="mt-4 text-sm leading-7 text-pfSubtle">{t("auth.reset.successText")}</p>
            <Link href="/login" className="btn-accent mt-7 justify-center">{t("auth.reset.backToLogin")}</Link>
          </div>
        ) : (
          <>
            <span className="label-mono mb-5 block">Kundenportal</span>
            <h1 className="font-display text-4xl leading-none text-pfText">{t("auth.reset.resetTitle")}</h1>
            <p className="mt-4 text-sm leading-7 text-pfSubtle">{t("auth.reset.resetSubtitle")}</p>
            <form onSubmit={submit} className="mt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <label htmlFor="new-password" className="label-mono">{t("auth.reset.password")}</label>
                <input id="new-password" className="pf-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="confirm-password" className="label-mono">{t("auth.reset.confirm")}</label>
                <input id="confirm-password" className="pf-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
              </div>
              {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={busy} className="btn-accent justify-center disabled:opacity-40">
                {busy ? "…" : `${t("auth.reset.submit")} →`}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
