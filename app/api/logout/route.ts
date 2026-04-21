import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));

  // relevante Auth-Cookies invalidieren
  res.cookies.set("pf_auth", "", { path: "/", maxAge: 0 });
  res.cookies.set("pf_session", "", { path: "/", maxAge: 0 });
  res.cookies.set("session", "", { path: "/", maxAge: 0 });

  return res;
}
