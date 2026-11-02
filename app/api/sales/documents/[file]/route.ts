import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { forbidden, salesActor } from "@/lib/sales/http";
import { findSalesDocument, salesDocsDir } from "@/lib/sales/documents";

export const dynamic = "force-dynamic";

// Nur Dateien aus der festen Liste (kein Pfad aus dem Request), nur SALES/ADMIN.
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const actor = await salesActor();
  if (!actor) return forbidden();
  const { file } = await ctx.params;
  const doc = findSalesDocument(file);
  if (!doc) return NextResponse.json({ message: "Nicht gefunden" }, { status: 404 });
  try {
    const buf = await readFile(path.join(salesDocsDir(), doc.file));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${doc.file}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "Dokument fehlt auf dem Server" }, { status: 404 });
  }
}
