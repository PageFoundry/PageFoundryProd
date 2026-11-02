import { NextResponse } from "next/server";
import { requireSalesOrAdmin, type JwtPayload } from "@/lib/auth";
import { CallError } from "./callService";
import { DemoError } from "./demoService";

// Gemeinsamer Guard + Fehler-Mapping fuer /api/sales/*. Die Middleware schuetzt /api
// nicht – jeder Handler prueft die Rolle selbst.

export async function salesActor(): Promise<JwtPayload | null> {
  try {
    return await requireSalesOrAdmin();
  } catch {
    return null;
  }
}

export const forbidden = () => NextResponse.json({ message: "Forbidden" }, { status: 403 });

export function errorResponse(err: unknown, tag: string) {
  if (err instanceof CallError) return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
  if (err instanceof DemoError) return NextResponse.json({ message: err.message }, { status: err.status });
  console.error(`[${tag}]`, err);
  return NextResponse.json({ message: "Serverfehler" }, { status: 500 });
}
