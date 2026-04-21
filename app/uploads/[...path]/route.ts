import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const ALLOWED = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

export async function GET(req: NextRequest, context: any) {
  try {
    const params = (context as any).params ?? {};
    const raw = params.path;
    const segments: string[] = Array.isArray(raw)
      ? raw
      : raw
      ? [raw]
      : [];

    if (!segments.length) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const rel = segments.join("/");
    if (rel.includes("..")) {
      return NextResponse.json({ message: "Invalid path" }, { status: 400 });
    }

    const ext = path.extname(rel).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return NextResponse.json({ message: "Unsupported type" }, { status: 400 });
    }

    const abs = path.join(process.cwd(), "public", "uploads", rel);
    const buf = await readFile(abs);

    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
        ? "image/webp"
        : ext === ".avif"
        ? "image/avif"
        : "application/octet-stream";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: any) {
    if (e && e.code === "ENOENT") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    console.error("uploads route error", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
