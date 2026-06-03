export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { TrustEngine } from "./TrustEngine";

export const metadata = {
  title: "Trust Engine — Milano Seal",
};

export interface TrustCounts {
  verifiedDeliveries: number;
  verifiedReleases: number;
  verifiedCountries: number;
}

export default async function TrustPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  const [deliveries, releases, countries] = await Promise.all([
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("matter_status", "completed")
      .not("shipped_at", "is", null),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .in("matter_status", ["completed", "released"]),
    supabase
      .from("deals")
      .select("destination_country")
      .eq("matter_status", "completed")
      .not("destination_country", "is", null),
  ]);

  const uniqueCountries = new Set(
    (countries.data ?? []).map((r) => r.destination_country)
  ).size;

  const counts: TrustCounts = {
    verifiedDeliveries: deliveries.count ?? 0,
    verifiedReleases: releases.count ?? 0,
    verifiedCountries: uniqueCountries,
  };

  return <TrustEngine counts={counts} />;
}
