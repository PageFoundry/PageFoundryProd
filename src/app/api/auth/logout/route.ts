import { NextResponse } from "next/server";

function clearCookieAndRedirect() {
  const res = NextResponse.redirect("https://pagefoundry.de", 302);

  // historischer Name (falls noch vorhanden)
  res.cookies.set("jwt", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain: "pagefoundry.de",
  });

  // primärer Auth-Cookie
  res.cookies.set("pf_auth", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain: "pagefoundry.de",
  });

  return res;
}

export async function GET() { return clearCookieAndRedirect(); }
export async function POST() { return clearCookieAndRedirect(); }
