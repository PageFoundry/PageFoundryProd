// src/components/StatusSelector.tsx
"use client";
import { useState } from "react";

export default function StatusSelector({ orderId, value }: { orderId: string; value: "RECEIVED"|"IN_PROGRESS"|"DONE" }) {
  const [v, setV] = useState(value);
  const [saving, setSaving] = useState(false);

  async function change(next: typeof v) {
    setV(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await res.text());
    } finally { setSaving(false); }
  }

  return (
    <select
      className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sm"
      value={v}
      disabled={saving}
      onChange={(e) => change(e.target.value as any)}
    >
      <option value="RECEIVED">Received</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="DONE">Done</option>
    </select>
  );
}
