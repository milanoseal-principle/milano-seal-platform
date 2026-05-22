import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { JURISDICTIONS } from "@/lib/jurisdictions";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createAdminClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("destination_country, country, origin_state");

  const counts = new Map<string, number>();
  for (const d of deals ?? []) {
    for (const v of [d.destination_country, d.country, d.origin_state]) {
      if (!v) continue;
      const k = String(v).toLowerCase();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }

  const summaries = JURISDICTIONS.map((j) => ({
    code: j.code,
    name: j.name,
    kind: j.kind,
    region: j.region,
    flag: j.flag,
    hague: j.hague,
    ron: j.ron,
    deals_count:
      (counts.get(j.name.toLowerCase()) ?? 0) +
      (counts.get(j.code.toLowerCase()) ?? 0),
  }));

  return NextResponse.json(summaries);
}
