import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PREFIXES = ["/checkout", "/dashboard", "/settings", "/admin"];

// Deutsche Detailseiten: eine URL, fester deutscher Inhalt. Die Middleware setzt
// fuer genau diese oeffentlichen Pfade ein internes Header-Flag, damit <html lang>
// und i18n nicht dem Locale-Cookie/Accept-Language folgen. Der Header ist nur
// vertrauenswuerdig, weil er hier gesetzt wird — eingehende Request mit gleichem
// Namen werden vorher immer entfernt/geloescht.
const GERMAN_ONLY_PATHS = new Set([
  "/ki-telefonassistenz",
  "/website-wache",
  "/website-rettung",
  "/webdesign-bergisches-land",
  "/seo-hueckeswagen",
]);

export const FORCED_LANG_HEADER = "x-pf-forced-lang";

export const config = {
  matcher: [
    "/checkout/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/((?!api|_next/static|_next/image|favicon\\.ico|dl/|uploads/|work/|social-audit-ui/).*)",
  ],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (needsAuth) {
    const hasAuth = !!(
      req.cookies.get("pf_session")?.value ||
      req.cookies.get("session")?.value ||
      req.cookies.get("pf_auth")?.value
    );
    if (!hasAuth) {
      // Vor dem Mutieren des geklonten URL-Objekts sichern. NextURL.clone() teilt in
      // bestimmten Runtime-Versionen intern Search-State; sonst geht die Query verloren.
      const requestUrl = new URL(req.url);
      const next = requestUrl.pathname + requestUrl.search;
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", next);
      return NextResponse.redirect(url);
    }
  }

  const requestHeaders = new Headers(req.headers);
  if (GERMAN_ONLY_PATHS.has(pathname)) {
    requestHeaders.set(FORCED_LANG_HEADER, "de");
  } else {
    requestHeaders.delete(FORCED_LANG_HEADER);
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}
