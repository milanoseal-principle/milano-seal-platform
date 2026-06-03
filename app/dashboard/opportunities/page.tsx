export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { OpportunityEngine } from "@/components/dashboard/OpportunityEngine";

export const metadata = {
  title: "Opportunities — The Milano Seal™",
  robots: { index: false },
};

async function getPartnerData(): Promise<{
  activePartners: number;
  partnerRevenue: number;
}> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("deals")
      .select("referral_source, total_price, payment_status")
      .not("referral_source", "is", null);

    if (error || !data) return { activePartners: 0, partnerRevenue: 0 };

    // Unique referral sources (active partners)
    const uniqueSources = new Set(
      data
        .map((d) => (d.referral_source as string | null)?.trim())
        .filter(Boolean),
    );

    // Revenue from partner-referred deals (regardless of payment status, track total)
    const partnerRevenue = data.reduce((sum, d) => {
      const price = typeof d.total_price === "number" ? d.total_price : 0;
      return sum + price;
    }, 0);

    return {
      activePartners: uniqueSources.size,
      partnerRevenue,
    };
  } catch {
    return { activePartners: 0, partnerRevenue: 0 };
  }
}

export default async function OpportunitiesPage() {
  await requireDashboardAccess();
  const { activePartners, partnerRevenue } = await getPartnerData();

  return (
    <OpportunityEngine
      activePartners={activePartners}
      partnerRevenue={partnerRevenue}
    />
  );
}
