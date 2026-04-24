import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GRAPH_HTML_PATH = "/home/ubuntu/obsidian-vault/graph.html";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const html = await readFile(GRAPH_HTML_PATH, "utf8");
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return new NextResponse("Knowledge graph not found. Generate it in /home/ubuntu/obsidian-vault first.", {
      status: 404,
    });
  }
}
