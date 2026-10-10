import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAvvPdf, generatePaymentInstructionsPdf, generateSlaPdf } from "@/lib/websitePlanDocuments";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  try {
    await requireAdmin();
    const { id, kind } = await params;
    if (kind !== "sla" && kind !== "avv" && kind !== "payment") return NextResponse.json({ message: "invalid_document" }, { status: 400 });
    const plan = await prisma.websitePlan.findUniqueOrThrow({ where: { id }, include: { client: true } });
    const pdf = kind === "sla" ? await generateSlaPdf(plan) : kind === "avv" ? await generateAvvPdf(plan) : await generatePaymentInstructionsPdf(plan);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="PF-${kind.toUpperCase()}-${id.slice(-10)}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return NextResponse.json({ message: "forbidden" }, { status: 403 });
    if (err?.code === "P2025") return NextResponse.json({ message: "not_found" }, { status: 404 });
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
