import { NextResponse } from "next/server";
import { routeCompliance } from "@/src/features/compliance/complianceRouter";

export async function GET(_request: Request, { params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  return NextResponse.json(routeCompliance(decodeURIComponent(country)));
}
