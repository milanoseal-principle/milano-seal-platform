export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CorridorEngine } from "./CorridorEngine";

export const metadata = {
  title: "Verified Corridor Engine — Milano Seal",
};

export interface CorridorRow {
  destination_country: string;
  document_type: string;
  matter_count: number;
}

export default async function CorridorsPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  const { data: raw } = await supabase
    .from("deals")
    .select("destination_country, document_type")
    .not("destination_country", "is", null)
    .not("document_type", "is", null);

  // Aggregate in memory
  const map = new Map<string, number>();
  for (const row of raw ?? []) {
    const key = `${row.destination_country}||${row.document_type}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const corridors: CorridorRow[] = Array.from(map.entries())
    .map(([key, count]) => {
      const [destination_country, document_type] = key.split("||");
      return { destination_country, document_type, matter_count: count };
    })
    .sort((a, b) => b.matter_count - a.matter_count);

  return <CorridorEngine corridors={corridors} />;
}
