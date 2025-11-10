"use client";

import { useState } from "react";

export default function ConsultationModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [preferredTime, setPreferredTime] = useState("MON_12_14");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submitRequest() {
    setErr("");

    const res = await fetch("/api/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        note,
        preferredTime,
      }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data.message || "Request failed");
    }
  }

  // closed state: render CTA button only
  if (!open) {
    return (
      <button
        className="rounded-full bg-pfOrange px-5 py-3 text-black text-sm font-semibold hover:brightness-110"
        onClick={() => setOpen(true)}
      >
        Free Consultation
      </button>
    );
  }

  // modal state
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={() => setOpen(false)}
      />

      {/* modal card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.07] p-6 text-white shadow-card backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="text-lg font-semibold">Free Consultation</div>
          <button
            className="text-zinc-500 text-xs hover:text-white"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>

        {done ? (
          <div className="text-sm text-zinc-300">
            Request received. We will call you.
          </div>
        ) : (
          <>
            <div className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Available Mon Tue Wed 12:00–20:00. We call you back.
            </div>

            <label className="block text-sm text-zinc-200 mb-3">
              <div className="mb-1">Name</div>
              <input
                className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-pfOrange"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="block text-sm text-zinc-200 mb-3">
              <div className="mb-1">Phone</div>
              <input
                className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-pfOrange"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49..."
                required
              />
            </label>

            <label className="block text-sm text-zinc-200 mb-3">
              <div className="mb-1">Project / Notes</div>
              <textarea
                className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-pfOrange min-h-[80px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What do you need? Landing page, SEO, hosting, etc."
              />
            </label>

            <label className="block text-sm text-zinc-200 mb-4">
              <div className="mb-1">Preferred time</div>
              <select
                className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-pfOrange"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              >
                <option value="MON_12_14">Mon 12-14</option>
                <option value="MON_14_16">Mon 14-16</option>
                <option value="MON_16_18">Mon 16-18</option>
                <option value="MON_18_20">Mon 18-20</option>
                <option value="TUE_12_14">Tue 12-14</option>
                <option value="TUE_14_16">Tue 14-16</option>
                <option value="TUE_16_18">Tue 16-18</option>
                <option value="TUE_18_20">Tue 18-20</option>
                <option value="WED_12_14">Wed 12-14</option>
                <option value="WED_14_16">Wed 14-16</option>
                <option value="WED_16_18">Wed 16-18</option>
                <option value="WED_18_20">Wed 18-20</option>
              </select>
            </label>

            {err && (
              <div className="text-red-400 text-xs mb-3">{err}</div>
            )}

            <button
              className="w-full rounded-full bg-pfOrange px-4 py-2 text-black text-sm font-semibold hover:brightness-110"
              onClick={submitRequest}
            >
              Send request
            </button>
          </>
        )}
      </div>
    </div>
  );
}
