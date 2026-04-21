import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Schützt Checkout-Routen. Prüft auf Vorhandensein von pf_session. */
export const config = { matcher: ["/checkout/:path*"] };

export function middleware(req: NextRequest) {
  const hasAuth = !!(req.cookies.get("pf_session")?.value || req.cookies.get("session")?.value || req.cookies.get("pf_auth")?.value);
  if (!hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
