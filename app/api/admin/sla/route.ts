import { getSLASummary } from "@/lib/slaEngine";
import { NextResponse } from "next/server";
import { requireOperator, isGuardFailure } from "@/lib/auth-guards";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireOperator();
  if (isGuardFailure(guard)) return guard.response;

  const summary = await getSLASummary();
  return NextResponse.json(summary);
}
