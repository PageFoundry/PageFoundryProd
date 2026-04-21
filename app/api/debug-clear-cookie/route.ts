import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const res = NextResponse.json({ cleared: true });
  for (const name of ["pf_session", "session"]) {
    res.cookies.set(name, "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".pagefoundry.de",
      path: "/",
      maxAge: 0,
    });
  }
  return res;
}
