"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, password }),
    });

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Registration failed");
    }
  }

  return (
    <section className="relative z-10 flex min-h-[70vh] items-center justify-center px-6 py-16 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm fade-in rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-card backdrop-blur-sm"
      >
        <h1 className="text-xl font-semibold text-white mb-6">
          Create account
        </h1>

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

        <label className="mb-4 block text-sm text-zinc-200">
          <div className="mb-1">Phone (optional)</div>
          <input
            className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-pfOrange"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="text"
            placeholder="+49..."
          />
        </label>

        <label className="mb-4 block text-sm text-zinc-200">
          <div className="mb-1">Password</div>
          <input
            className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-pfOrange"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        <label className="mb-6 block text-sm text-zinc-200">
          <div className="mb-1">Repeat password</div>
          <input
            className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-pfOrange"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
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
          Sign up
        </button>

        <div className="mt-4 text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <a href="/login" className="text-pfOrange">
            Login
          </a>
        </div>
      </form>
    </section>
  );
}
