import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, forbidden, salesActor } from "@/lib/sales/http";
import { defaultDemoMessage, listDemos } from "@/lib/sales/demoService";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await salesActor();
  if (!actor) return forbidden();
  try {
    const demos = await listDemos(actor);
    const me = await prisma.user.findUnique({ where: { id: actor.sub }, select: { name: true, email: true, referralCode: true } });
    return NextResponse.json({
      demos: demos.map((d) => ({ ...d, draftMessage: d.state === "READY" && me ? defaultDemoMessage(d, me) : null })),
    });
  } catch (err) {
    return errorResponse(err, "sales/demos GET");
  }
}
