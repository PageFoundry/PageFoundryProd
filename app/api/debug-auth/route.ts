import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const pf = req.cookies.get("pf_session")?.value || "";
  const legacy = req.cookies.get("session")?.value || "";
  const token = pf || legacy;
  const usedName = pf ? "pf_session" : legacy ? "session" : null;

  const meta = {
    hasCookie: !!token,
    len: token.length,
    usedName,
    proto: req.headers.get("x-forwarded-proto"),
    host: req.headers.get("x-forwarded-host") ?? req.headers.get("host"),
  };

  if (!token) return NextResponse.json({ ok: false, meta, error: "no cookie" }, { status: 401 });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return NextResponse.json({ ok: true, meta, payload });
  } catch (e: any) {
    return NextResponse.json({ ok: false, meta, error: e?.message || "invalid" }, { status: 401 });
  }
}
