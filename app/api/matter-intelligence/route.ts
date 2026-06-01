import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { computeMatterIntelligence } from "@/lib/matterIntelligence";
import type { MatterIntelligenceInput } from "@/lib/matterIntelligence";

export const runtime = "nodejs";

// GET /api/matter-intelligence?country=italy&document=birth-certificate&matter_type=citizenship_by_descent&authority=comune-di-roma
export async function GET(req: NextRequest) {
  await requireDashboardAccess();

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const document = searchParams.get("document");
  const matter_type = searchParams.get("matter_type");

  if (!country || !document || !matter_type) {
    return NextResponse.json(
      { error: "country, document, and matter_type are required" },
      { status: 400 },
    );
  }

  const input: MatterIntelligenceInput = {
    country_id: country,
    document_id: document,
    matter_type: matter_type as MatterIntelligenceInput["matter_type"],
    receiving_authority_slug: searchParams.get("authority") ?? null,
    is_paid: searchParams.get("is_paid") === "true",
    is_notarized: searchParams.get("is_notarized") === "true",
    has_translation: searchParams.get("has_translation") === "true",
    has_apostille: searchParams.get("has_apostille") === "true",
    has_scheduled: searchParams.get("has_scheduled") === "true",
    courier_status: searchParams.get("courier_status"),
    deal_status: searchParams.get("deal_status"),
  };

  const result = computeMatterIntelligence(input);

  return NextResponse.json({ intelligence: result });
}
