import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = new Set(["image/png","image/jpeg","image/webp","image/avif"]);

export async function POST(req: NextRequest) {
  const user = getUserFromCookie();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll("files");

  if (!files.length) return NextResponse.json({ message: "No files" }, { status: 400 });

  const saved: string[] = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
    if (!ALLOWED.has(f.type || "")) {
      return NextResponse.json({ message: `Unsupported type: ${f.type}` }, { status: 400 });
    }
    if (f.size > MAX_SIZE) {
      return NextResponse.json({ message: "File too large" }, { status: 400 });
    }

    const buf = Buffer.from(await f.arrayBuffer());
    const ext =
      f.type === "image/png"  ? ".png"  :
      f.type === "image/jpeg" ? ".jpg"  :
      f.type === "image/webp" ? ".webp" :
      f.type === "image/avif" ? ".avif" : "";
    const name = crypto.randomBytes(16).toString("hex") + ext;
    const out = path.join(process.cwd(), "public", "uploads", name);
    await writeFile(out, buf);
    saved.push(`/uploads/${name}`);
  }

  return NextResponse.json({ urls: saved }, { status: 200 });
}
