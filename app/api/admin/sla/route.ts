import { getSLASummary } from "@/lib/slaEngine";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const summary = await getSLASummary();
  return NextResponse.json(summary);
}
