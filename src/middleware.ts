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
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
