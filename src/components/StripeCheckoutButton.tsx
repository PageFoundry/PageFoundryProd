"use client";

import { useState } from "react";

export default function StripeCheckoutButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/stripe/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setErr(data.error || "Checkout failed");
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="mt-8 w-full rounded-full bg-pfOrange px-4 py-3 text-black text-sm font-semibold hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Continue with Stripe"}
      </button>
      {err && <div className="text-red-400 text-xs mt-2">{err}</div>}
    </div>
  );
}

