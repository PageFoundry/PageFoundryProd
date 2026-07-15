"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LanguageSwitch from "./LanguageSwitch";

type Labels = {
  packages: string; consultation: string; dashboard: string; admin: string;
  login: string; getStarted: string; logout: string; language: string;
  menu: string; closeMenu: string;
};
type Props = { isAuthed: boolean; isAdmin: boolean; labels: Labels; };

export default function MobileNav({ isAuthed, isAdmin, labels }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    document.body.style.overflow = open ? "hidden" : "";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const navLinkClass =
    "block rounded-sm border border-white/10 bg-black/25 px-4 py-4 font-mono text-sm tracking-widest uppercase text-pfText shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-pfAccent hover:bg-pfAccentDim hover:text-pfAccent";

  return (
    <>
      <button
        aria-label={labels.menu}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen(true)}
        className="sm:hidden flex flex-col gap-[5px] p-2 border border-pfBorderMid rounded-sm hover:border-pfAccent transition-colors"
      >
        <span className="block w-4 h-[1px] bg-pfAccent" />
        <span className="block w-4 h-[1px] bg-pfAccent" />
        <span className="block w-3 h-[1px] bg-pfAccent" />
      </button>

      <div
        className={`fixed inset-0 z-[80] bg-black/80 transition-opacity duration-300 sm:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)" }}
        onClick={close}
      />

      <aside
        id="mobile-navigation"
        className={`fixed right-0 top-0 z-[90] flex h-dvh w-full flex-col overflow-y-auto border-l border-white/10 bg-[#050505]/95 shadow-[-28px_0_90px_rgba(0,0,0,0.86)] transition-transform duration-300 ease-out sm:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backdropFilter: "blur(40px) saturate(150%)", WebkitBackdropFilter: "blur(40px) saturate(150%)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(201,168,76,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_42%)]" />

        <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-5">
          <span
            className="text-pfText text-2xl tracking-widest leading-none"
            style={{ fontFamily: "var(--font-display), Impact, sans-serif" }}
          >
            PAGEFOUNDRY
          </span>
          <button
            aria-label={labels.closeMenu}
            onClick={close}
            className="border border-pfBorderMid bg-black/30 rounded-sm px-3 py-2 text-pfSubtle hover:text-pfAccent hover:border-pfAccent transition-colors font-mono text-xs"
          >
            ✕
          </button>
        </div>

        <nav className="relative flex flex-1 flex-col gap-3 px-5 py-6">
          <Link href="/#packages" onClick={close} className={navLinkClass}>{labels.packages}</Link>
          <Link href="/consultation" onClick={close} className={navLinkClass}>{labels.consultation}</Link>

          {isAuthed ? (
            <>
              <Link href="/dashboard" onClick={close} className={navLinkClass}>{labels.dashboard}</Link>
              <Link href="/settings" onClick={close} className={navLinkClass}>Settings</Link>
              {isAdmin && (
                <>
                  <Link href="/outreach" onClick={close} className={navLinkClass}>Outreach</Link>
                  <Link
                    href="/admin"
                    onClick={close}
                    className="block rounded-sm border border-pfBorderAccent bg-pfAccentDim px-4 py-4 font-mono text-sm tracking-widest uppercase text-pfAccent transition-colors hover:bg-pfAccent/15"
                  >
                    {labels.admin}
                  </Link>
                </>
              )}
              <form action="/api/auth/logout" method="POST" onSubmit={close}>
                <button type="submit" className="btn-accent mt-2 w-full">
                  {labels.logout}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" onClick={close} className={navLinkClass}>{labels.login}</Link>
              <Link href="/consultation" onClick={close} className="btn-accent mt-2 w-full">
                {labels.getStarted}
              </Link>
            </>
          )}
        </nav>

        <div className="relative flex items-center justify-between gap-4 border-t border-white/10 px-6 pb-8 pt-4">
          <span className="label-mono">© {new Date().getFullYear()} PageFoundry</span>
          <div aria-label={labels.language}>
            <LanguageSwitch />
          </div>
        </div>
      </aside>
    </>
  );
}
