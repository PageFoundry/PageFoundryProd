import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "DEV_ONLY_CHANGE_ME"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // i18n bootstrap: set language cookie once if missing
  try {
    const LANG_COOKIE = "lang";
    const c = req.cookies.get(LANG_COOKIE)?.value;
    if (!c) {
      const al = (req.headers.get("accept-language") || "").toLowerCase();
      const guess = al.startsWith("de") ? "de" : "en";
      const res = NextResponse.next();
      res.cookies.set(LANG_COOKIE, guess, {
        httpOnly: false, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365,
      });
      return res;
    }
  } catch {}

  const protectedUserRoutes = ["/dashboard", "/settings", "/checkout"];
  const adminRoutes = ["/admin"];

  const needsUser = protectedUserRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const needsAdmin = adminRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  if (!needsUser && !needsAdmin) return NextResponse.next();

  const token =
    req.cookies.get("pf_session")?.value ||
    req.cookies.get("pf_auth")?.value ||
    req.cookies.get("session")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string | undefined;

    if (needsAdmin && role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/checkout/:path*", "/admin/:path*"],
};
