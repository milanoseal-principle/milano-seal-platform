export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CommandCenter } from "@/components/dashboard/CommandCenter";

export default async function CommandPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  // Revenue — all paid deals
  let paidDeals: {
    total_price: number;
    created_at: string;
    destination_country: string;
    document_type: string;
    lane: string | null;
    matter_status: string;
  }[] = [];
  try {
    const { data } = await supabase
      .from("deals")
      .select(
        "total_price, created_at, destination_country, document_type, lane, matter_status"
      )
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false });
    paidDeals = data ?? [];
  } catch {}

  // Pipeline — unpaid, not cancelled
  let openDeals: {
    total_price: number;
    conversion_score: number | null;
    matter_status: string;
    destination_country: string;
    client_name: string | null;
    created_at: string;
  }[] = [];
  try {
    const { data } = await supabase
      .from("deals")
      .select(
        "total_price, conversion_score, matter_status, destination_country, client_name, created_at"
      )
      .eq("payment_status", "unpaid")
      .neq("matter_status", "cancelled");
    openDeals = data ?? [];
  } catch {}

  // Active matters
  let activeMatters: {
    id: string;
    client_name: string | null;
    matter_status: string;
    destination_country: string;
    apostille_at: string | null;
    updated_at: string;
    total_price: number;
    created_at: string;
  }[] = [];
  try {
    const { data } = await supabase
      .from("deals")
      .select(
        "id, client_name, matter_status, destination_country, apostille_at, updated_at, total_price, created_at"
      )
      .eq("payment_status", "paid")
      .not("matter_status", "in", '("completed","released","cancelled")')
      .order("created_at", { ascending: false })
      .limit(8);
    activeMatters = data ?? [];
  } catch {}

  // Releases ready
  let releasesReady: {
    id: string;
    client_name: string | null;
    matter_status: string;
  }[] = [];
  try {
    const { data } = await supabase
      .from("deals")
      .select("id, client_name, matter_status")
      .in("matter_status", ["apostille_complete", "ready_for_release"]);
    releasesReady = data ?? [];
  } catch {}

  // Stale matters (no update in 7+ days)
  let staleMatters: {
    id: string;
    client_name: string | null;
    matter_status: string;
    updated_at: string;
  }[] = [];
  try {
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data } = await supabase
      .from("deals")
      .select("id, client_name, matter_status, updated_at")
      .eq("payment_status", "paid")
      .lt("updated_at", sevenDaysAgo)
      .not("matter_status", "in", '("completed","released","cancelled")');
    staleMatters = data ?? [];
  } catch {}

  return (
    <CommandCenter
      paidDeals={paidDeals}
      openDeals={openDeals}
      activeMatters={activeMatters}
      releasesReady={releasesReady}
      staleMatters={staleMatters}
    />
  );
}
