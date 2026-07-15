import Link from "next/link";
import { getUserFromCookie } from "@/lib/auth";
import LanguageSwitch from "./LanguageSwitch";
import { getServerI18n } from "@/i18n/server";
import MobileNav from "./MobileNav";

export default async function Navbar() {
  const user = await getUserFromCookie();
  const isAuthed = !!user;
  const isAdmin = user?.role === "ADMIN";

  const { t } = await getServerI18n();

  const labels = {
    packages:     t("navbar.packages"),
    consultation: t("navbar.consultation"),
    dashboard:    t("navbar.dashboard"),
    admin:        t("navbar.admin"),
    login:        t("navbar.login"),
    getStarted:   t("navbar.getStarted"),
    logout:       t("navbar.logout"),
    language:     t("navbar.language"),
    menu:         t("navbar.menu"),
    closeMenu:    t("navbar.closeMenu"),
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-pfBorder bg-pfBg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-3">

        {/* Logo */}
        <Link
          href="/"
          className="font-display text-2xl tracking-widest text-pfText hover:text-pfAccent transition-colors leading-none"
          style={{ fontFamily: "var(--font-display), Impact, sans-serif" }}
        >
          PAGEFOUNDRY
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-7">
          <Link
            href="/#packages"
            className="font-mono text-[0.65rem] tracking-widest uppercase text-pfSubtle hover:text-pfAccent transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("navbar.packages")}
          </Link>

          <Link
            href="/consultation"
            className="font-mono text-[0.65rem] tracking-widest uppercase text-pfSubtle hover:text-pfAccent transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("navbar.consultation")}
          </Link>

          {isAuthed ? (
            <>
              <Link
                href="/dashboard"
                className="font-mono text-[0.65rem] tracking-widest uppercase text-pfSubtle hover:text-pfAccent transition-colors"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t("navbar.dashboard")}
              </Link>

              <Link
                href="/settings"
                className="font-mono text-[0.65rem] tracking-widest uppercase text-pfSubtle hover:text-pfAccent transition-colors"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Settings
              </Link>

              {isAdmin && (
                <>
                  <Link
                    href="/outreach"
                    className="font-mono text-[0.65rem] tracking-widest uppercase text-pfSubtle hover:text-pfAccent transition-colors"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Outreach
                  </Link>
                  <Link
                    href="/admin"
                    className="font-mono text-[0.65rem] tracking-widest uppercase border border-pfBorderAccent text-pfAccent px-3 py-1.5 rounded-sm hover:bg-pfAccentDim transition-all"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {t("navbar.admin")}
                  </Link>
                </>
              )}

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="btn-accent text-[0.62rem] px-4 py-2"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {t("navbar.logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-mono text-[0.65rem] tracking-widest uppercase text-pfSubtle hover:text-pfAccent transition-colors"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t("navbar.login")}
              </Link>

              <Link href="/consultation" className="btn-accent text-[0.62rem] px-4 py-2">
                {t("navbar.getStarted")}
              </Link>
            </>
          )}

          <LanguageSwitch />
        </div>

        {/* Mobile */}
        <MobileNav isAuthed={isAuthed} isAdmin={isAdmin} labels={labels} />
      </div>
    </nav>
  );
}
