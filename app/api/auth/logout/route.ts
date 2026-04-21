import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const base = process.env.APP_BASE_URL || "https://pagefoundry.de";
  const res = NextResponse.redirect(new URL("/", base), { status: 303 });

  const opts = {
    path: "/",
    domain: ".pagefoundry.de",
    secure: true,
    httpOnly: true,
    sameSite: "none" as const,
    maxAge: 0,
  };

  res.cookies.set("pf_session", "", opts);
  res.cookies.set("session",   "", opts);

  // kein Caching
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");

  return res;
}
