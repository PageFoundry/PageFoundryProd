import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateOptionDocumentPdf, getOptionDocumentForPdf } from "@/lib/pagefoundryHq";

function extractIdFromUrl(url: string) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const idIndex = parts.indexOf("option-documents") + 1;
  return idIndex > 0 ? parts[idIndex] : null;
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const id = extractIdFromUrl(req.url);
    if (!id) return NextResponse.json({ message: "missing id" }, { status: 400 });
    const document = await getOptionDocumentForPdf(id);
    const pdf = await generateOptionDocumentPdf(document.id);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${document.number}.pdf"`,
      },
    });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (err?.code === "P2025") return NextResponse.json({ message: "not found" }, { status: 404 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
