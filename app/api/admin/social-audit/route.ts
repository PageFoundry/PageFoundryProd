import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAndRunSocialAudit, getSocialAuditSnapshot } from "@/lib/socialAudit/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeBody(body: any) {
  return {
    companyName: typeof body.companyName === "string" ? body.companyName : undefined,
    website: typeof body.website === "string" ? body.website : undefined,
    instagram: typeof body.instagram === "string" ? body.instagram : undefined,
    facebook: typeof body.facebook === "string" ? body.facebook : undefined,
    tiktok: typeof body.tiktok === "string" ? body.tiktok : undefined,
    followers: body.followers === "" || body.followers === undefined ? undefined : Number(body.followers),
    posts: body.posts === "" || body.posts === undefined ? undefined : Number(body.posts),
    avgLikes: body.avgLikes === "" || body.avgLikes === undefined ? undefined : Number(body.avgLikes),
  };
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(getSocialAuditSnapshot());
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const input = normalizeBody(body);
    if (!input.instagram && !input.facebook && !input.tiktok && !input.website) {
      return NextResponse.json({ message: "profile_or_website_required" }, { status: 400 });
    }
    const audit = await createAndRunSocialAudit(input);
    return NextResponse.json({ ok: true, audit }, { status: 201 });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    return NextResponse.json({ message: err?.message || "server error" }, { status: 500 });
  }
}
