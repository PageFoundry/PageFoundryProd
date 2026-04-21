"use client";
import { useState } from "react";
import Link from "next/link";
import LoginProviders from "@/components/LoginProviders";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        throw new Error(d?.message || "Login failed");
      }
      location.href = "/dashboard";
    } catch (ex: any) {
      setErr(ex?.message || "Login error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section-pad flex items-start justify-center min-h-screen">
      <div className="w-full max-w-sm fade-in">

        <div className="mb-10">
          <span className="label-mono block mb-5">Access</span>
          <h1
            className="text-pfText leading-none mb-3"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 8vw, 5rem)",
            }}
          >
            Welcome.
          </h1>
          <p className="text-pfSubtle text-sm">Sign in to your PageFoundry account.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <label
              className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              E-Mail
            </label>
            <input
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
              className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Password
            </label>
            <div className="relative">
              <input
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
                className="absolute right-0 top-1/2 -translate-y-1/2 text-pfMuted hover:text-pfAccent transition-colors font-mono text-xs px-1"
              >
                {showPw ? "○" : "●"}
              </button>
            </div>
          </div>

          {err && (
            <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-sm px-3 py-2 font-mono">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-accent w-full justify-center disabled:opacity-40 disabled:cursor-wait"
          >
            {busy ? "…" : "Sign In →"}
          </button>

          <p className="text-center text-xs text-pfMuted" style={{ fontFamily: "var(--font-mono)" }}>
            No account?{" "}
            <Link href="/register" className="text-pfAccent hover:text-pfAccentWarm transition-colors">
              Create one
            </Link>
          </p>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-pfBorder" />
          <span className="text-pfMuted font-mono text-[0.6rem] tracking-widest uppercase">or</span>
          <div className="flex-1 h-px bg-pfBorder" />
        </div>

        <LoginProviders next="/dashboard" />

      </div>
    </section>
  );
}
