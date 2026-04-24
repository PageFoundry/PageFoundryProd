"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Labels = {
  packages: string; consultation: string; dashboard: string; admin: string;
  login: string; getStarted: string; logout: string; language: string;
};
type Props = { isAuthed: boolean; isAdmin: boolean; labels: Labels; };

export default function MobileNav({ isAuthed, isAdmin, labels }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  const navLinkClass =
    "font-mono text-sm tracking-widest uppercase text-pfSubtle hover:text-pfAccent transition-colors py-1";

  return (
    <>
      {/* Hamburger */}
      <button
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="sm:hidden flex flex-col gap-[5px] p-2 border border-pfBorderMid rounded-sm hover:border-pfAccent transition-colors"
      >
        <span className="block w-4 h-[1px] bg-pfAccent" />
        <span className="block w-4 h-[1px] bg-pfAccent" />
        <span className="block w-3 h-[1px] bg-pfAccent" />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-0 z-[90] flex flex-col transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#000000" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pfBorder px-6 py-4">
          <span
            className="text-pfText text-2xl tracking-widest leading-none"
            style={{ fontFamily: "var(--font-display), Impact, sans-serif" }}
          >
            PAGEFOUNDRY
          </span>
          <button
            aria-label="Close"
            onClick={close}
            className="border border-pfBorderMid rounded-sm px-2.5 py-1 text-pfSubtle hover:text-pfAccent hover:border-pfAccent transition-colors font-mono text-xs"
          >
            ✕
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-6 px-6 py-8 flex-1">
          <Link href="/" onClick={close} className={navLinkClass}>{labels.packages}</Link>
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
                    className="font-mono text-sm tracking-widest uppercase text-pfAccent border border-pfBorderAccent px-3 py-2 rounded-sm hover:bg-pfAccentDim transition-colors w-fit"
                  >
                    {labels.admin}
                  </Link>
                </>
              )}
              <form action="/api/auth/logout" method="POST" onSubmit={close}>
                <button type="submit" className="btn-accent mt-2">
                  {labels.logout}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" onClick={close} className={navLinkClass}>{labels.login}</Link>
              <Link href="/register" onClick={close} className="btn-accent mt-2 w-fit">
                {labels.getStarted}
              </Link>
            </>
          )}
        </nav>

        <div className="px-6 pb-8 border-t border-pfBorder pt-4">
          <span className="label-mono">© {new Date().getFullYear()} PageFoundry</span>
        </div>
      </aside>
    </>
  );
}
