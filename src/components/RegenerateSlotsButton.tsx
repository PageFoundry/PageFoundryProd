"use client";

import { useState } from "react";

type State = "idle" | "confirm" | "loading" | "done" | "error";

export default function RegenerateSlotsButton() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string>("");

  async function run() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/admin/consultation/regenerate-slots", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(data?.message || `Fehler (${res.status})`);
        return;
      }
      setState("done");
      setMessage(
        `${data.deleted ?? 0} zukünftige Slots gelöscht — werden mit den aktuellen Zeiten neu erzeugt.`
      );
    } catch {
      setState("error");
      setMessage("Netzwerkfehler");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {state === "confirm" ? (
        <div className="flex items-center gap-2">
          <span className="text-pfMuted font-mono text-[0.58rem]">
            Ungebuchte Zukunfts-Slots löschen?
          </span>
          <button onClick={run} className="btn-accent text-[0.58rem] px-3 py-1.5">
            Ja, neu generieren
          </button>
          <button
            onClick={() => setState("idle")}
            className="btn-outline text-[0.58rem] px-3 py-1.5"
          >
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          onClick={() => setState("confirm")}
          disabled={state === "loading"}
          className="btn-outline text-[0.58rem] px-3 py-1.5 disabled:opacity-40 disabled:cursor-wait"
        >
          {state === "loading" ? "Generiere…" : "Slots neu generieren"}
        </button>
      )}
      {message && (
        <span
          className={`font-mono text-[0.55rem] ${
            state === "error" ? "text-red-400" : "text-pfMuted"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
