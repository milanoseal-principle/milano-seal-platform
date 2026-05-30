import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isClosedWon, isOpenStage } from "@/lib/stateMachine";
import { serializeDealMS } from "@/lib/milanoSerialize";

export const runtime = "nodejs";

// Canonical map destinations — order mirrors the globe
const MAP_COUNTRIES = [
  "Italy",
  "Spain",
  "UAE",
  "Brazil",
  "Mexico",
  "Portugal",
  "Greece",
];

export interface DestinationStats {
  country: string;
  active: number;
  awaiting_payment: number;
  in_execution: number;
  apostille: number;
  shipped: number;
  completed: number;
  revenue_pipeline: number;
  revenue_closed: number;
  most_recent_at: string | null;
}

export async function GET() {
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("deals")
    .select(
      "id,destination_country,deal_status,payment_status,total_price,created_at"
    )
    .in("destination_country", MAP_COUNTRIES)
    .order("created_at", { ascending: false })
    .limit(2000);

  const deals = (rows ?? []).map(serializeDealMS);

  const stats: DestinationStats[] = MAP_COUNTRIES.map((country) => {
    const cd = deals.filter(
      (d) => d.destination_country?.toLowerCase() === country.toLowerCase()
    );

    const active       = cd.filter((d) => isOpenStage(d.deal_status)).length;
    const awaiting     = cd.filter((d) => d.deal_status === "awaiting_payment").length;
    const in_execution = cd.filter((d) => d.deal_status === "in_execution").length;
    const apostille    = cd.filter((d) => d.deal_status === "apostille").length;
    const shipped      = cd.filter((d) => d.deal_status === "shipped").length;
    const completed    = cd.filter((d) => isClosedWon(d.deal_status)).length;

    const revenue_pipeline = cd
      .filter((d) => isOpenStage(d.deal_status))
      .reduce((s, d) => s + (d.total_price ?? 0), 0);
    const revenue_closed = cd
      .filter((d) => isClosedWon(d.deal_status))
      .reduce((s, d) => s + (d.total_price ?? 0), 0);

    const most_recent_at = cd.length > 0 ? cd[0].created_at : null;

    return {
      country,
      active,
      awaiting_payment: awaiting,
      in_execution,
      apostille,
      shipped,
      completed,
      revenue_pipeline,
      revenue_closed,
      most_recent_at,
    };
  });

  return NextResponse.json({ destinations: stats });
}
