"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/useI18n";

type SettingsUser = {
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
};

export default function SettingsPage() {
  const { t, lang } = useI18n();

  const [user, setUser] = useState<SettingsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = (await res.json()) as SettingsUser;
        if (!alive) return;
        setUser(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
      } catch {
        // ignore
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setProfileMsg(null);
    setProfileErr(null);
    setProfileBusy(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileErr(data.error || t("settings.error"));
      } else {
        setProfileMsg(t("settings.successProfile"));
        setUser({ ...user, name: name || null, phone: phone || null });
      }
    } catch {
      setProfileErr(t("settings.error"));
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setPwMsg(null);
    setPwErr(null);

    if (!newPassword) {
      setPwErr(t("settings.pwRequired"));
      return;
    }
    if (newPassword.length < 8) {
      setPwErr(t("settings.pwMinLength"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwErr(t("settings.pwMismatch"));
      return;
    }

    setPasswordBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwErr(data.error || t("settings.error"));
      } else {
        setPwMsg(t("settings.successPassword"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch {
      setPwErr(t("settings.error"));
    } finally {
      setPasswordBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="section-pad">
        <div className="max-w-screen-xl mx-auto">
          <p className="text-pfMuted font-mono text-xs tracking-widest uppercase">
            {t("settings.loading")}
          </p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section-pad">
        <div className="max-w-screen-xl mx-auto">
          <span className="label-mono block mb-4">Account Settings</span>
          <h1 className="page-title mb-4">{t("settings.title")}</h1>
          <p className="text-pfSubtle text-sm">{t("settings.error")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-pad">
      <div className="max-w-screen-xl mx-auto space-y-12 fade-in">

        {/* Header */}
        <div className="border-b border-pfBorder pb-8">
          <span className="label-mono block mb-4">Account Settings</span>
          <h1
            className="leading-none text-pfText"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 7vw, 5rem)",
            }}
          >
            {t("settings.title")}
          </h1>
          <p className="text-pfSubtle text-sm mt-3">{t("settings.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Profile */}
          <div className="pf-card p-6">
            <span className="label-mono block mb-6">{t("settings.profile")}</span>

            <form onSubmit={saveProfile} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("settings.email")}
                </label>
                <input
                  value={user.email}
                  disabled
                  className="pf-input opacity-40 cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("settings.name")}
                </label>
                <input
                  className="pf-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="—"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("settings.phone")}
                </label>
                <input
                  className="pf-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="—"
                />
              </div>

              {profileMsg && (
                <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-sm px-3 py-2 font-mono">
                  {profileMsg}
                </div>
              )}
              {profileErr && (
                <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-sm px-3 py-2 font-mono">
                  {profileErr}
                </div>
              )}

              <button
                type="submit"
                disabled={profileBusy}
                className="btn-accent justify-center disabled:opacity-40 disabled:cursor-wait"
              >
                {profileBusy ? "…" : `${t("settings.saveProfile")} →`}
              </button>
            </form>
          </div>

          {/* Password */}
          <div className="pf-card p-6">
            <span className="label-mono block mb-6">{t("settings.password")}</span>

            <form onSubmit={savePassword} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("settings.currentPassword")}
                </label>
                <input
                  type="password"
                  className="pf-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("settings.newPassword")}
                </label>
                <input
                  type="password"
                  className="pf-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[0.62rem] tracking-widest uppercase text-pfMuted">
                  {t("settings.confirmPassword")}
                </label>
                <input
                  type="password"
                  className="pf-input"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {pwMsg && (
                <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-sm px-3 py-2 font-mono">
                  {pwMsg}
                </div>
              )}
              {pwErr && (
                <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-sm px-3 py-2 font-mono">
                  {pwErr}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordBusy}
                className="btn-accent justify-center disabled:opacity-40 disabled:cursor-wait"
              >
                {passwordBusy ? "…" : `${t("settings.savePassword")} →`}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
