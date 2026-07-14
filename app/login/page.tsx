"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LoginProviders from "@/components/LoginProviders";
import { useI18n } from "@/i18n/useI18n";
import { safeRelativePath } from "@/lib/safePath";

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/dashboard");

  useEffect(() => {
    // ?next= kommt u. a. von der Checkout-Middleware; nur interne Pfade zulassen.
    const params = new URLSearchParams(window.location.search);
    setNext(safeRelativePath(params.get("next")));
    if (params.get("err")) setErr(t("auth.login.failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({ message: "error" }));
        throw new Error(d?.message || t("auth.login.failed"));
      }
      location.href = next;
    } catch (ex: any) {
      setErr(ex?.message || t("auth.login.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section-pad flex items-start justify-center min-h-screen">
      <div className="w-full max-w-sm fade-in">

        <div className="mb-10">
          <span className="label-mono block mb-5">{t("auth.login.label")}</span>
          <h1
            className="text-pfText leading-none mb-3"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 8vw, 5rem)",
            }}
          >
            {t("auth.login.title")}
          </h1>
          <p className="text-pfSubtle text-sm">{t("auth.login.subtitle")}</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="login-email"
              className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t("auth.login.email")}
            </label>
            <input
              id="login-email"
              className="pf-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="login-password"
              className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t("auth.login.password")}
            </label>
            <div className="relative">
              <input
                id="login-password"
                className="pf-input pr-10"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
                aria-pressed={showPw}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-pfMuted hover:text-pfAccent transition-colors font-mono text-xs px-2 py-2"
              >
                {showPw ? "○" : "●"}
              </button>
            </div>
            <p className="mt-1 text-right">
              <Link
                href="/forgot-password"
                className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted hover:text-pfAccent transition-colors"
              >
                {t("auth.login.forgot")}
              </Link>
            </p>
          </div>

          {err && (
            <div role="alert" className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-sm px-3 py-2 font-mono">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-accent w-full justify-center disabled:opacity-40 disabled:cursor-wait"
          >
            {busy ? "…" : `${t("auth.login.submit")} →`}
          </button>

          <p className="text-center text-xs text-pfMuted" style={{ fontFamily: "var(--font-mono)" }}>
            {t("auth.login.noAccount")}{" "}
            <Link href="/register" className="text-pfAccent hover:text-pfAccentWarm transition-colors">
              {t("auth.login.create")}
            </Link>
          </p>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-pfBorder" />
          <span className="text-pfMuted font-mono text-[0.6rem] tracking-widest uppercase">{t("auth.login.or")}</span>
          <div className="flex-1 h-px bg-pfBorder" />
        </div>

        <LoginProviders next={next} />

        <div className="mt-10 border-t border-pfBorder pt-6 text-center">
          <p className="text-xs text-pfSubtle">
            {t("auth.login.newHere")}{" "}
            <Link href="/consultation" className="text-pfAccent hover:text-pfAccentWarm transition-colors">
              {t("auth.login.newHereCta")}
            </Link>
          </p>
        </div>

      </div>
    </section>
  );
}
