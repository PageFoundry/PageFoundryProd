"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Login failed");
    }
  }

  return (
    <section className="relative z-10 flex min-h-[70vh] items-center justify-center px-6 py-16 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm fade-in rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-card backdrop-blur-sm"
      >
        <h1 className="text-xl font-semibold text-white mb-6">Login</h1>

        <label className="mb-4 block text-sm text-zinc-200">
          <div className="mb-1">Email</div>
          <input
            className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-pfOrange"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>

        <label className="mb-6 block text-sm text-zinc-200">
          <div className="mb-1">Password</div>
          <input
            className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-pfOrange"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        {error && (
          <div className="mb-4 text-sm text-red-400">{error}</div>
        )}

        <button
          type="submit"
          className="w-full rounded-full bg-pfOrange px-4 py-2 text-black text-sm font-semibold hover:brightness-110"
        >
          Sign in
        </button>

        <div className="mt-4 text-center text-xs text-zinc-500">
          No account?{" "}
          <a href="/register" className="text-pfOrange">
            Register
          </a>
        </div>
      </form>
    </section>
  );
}
