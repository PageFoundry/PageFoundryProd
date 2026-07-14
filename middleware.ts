import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Schuetzt eingeloggte Bereiche. Prueft nur das Vorhandensein von pf_session —
 * Rollen-/Signaturpruefung machen die Seiten und API-Routen selbst
 * (requireAdmin bzw. getUserFromCookie).
 */
export const config = {
  matcher: ["/checkout/:path*", "/dashboard/:path*", "/settings/:path*", "/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const hasAuth = !!(req.cookies.get("pf_session")?.value || req.cookies.get("session")?.value || req.cookies.get("pf_auth")?.value);
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
  return NextResponse.next();
}
