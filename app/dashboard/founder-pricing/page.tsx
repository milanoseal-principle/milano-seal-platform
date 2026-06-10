import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import FounderDiscountOverridePanel from "@/components/dashboard/pricing/FounderDiscountOverridePanel";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ deal_id?: string; email?: string }>;
}

export default async function FounderPricingPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard");

  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (role !== "founder_admin") redirect("/dashboard");

  const params = await searchParams;
  const { deal_id, email } = params;

  let deal: Record<string, unknown> | null = null;
  let searchError: string | null = null;

  if (deal_id || email) {
    const admin = createAdminClient();
    let query = admin.from("deals").select(
      "id, amount, payment_status, status, discount_type, discount_amount, discount_reason, discount_note, founder_price_override, platform_fee_required, service_fee_waived, price_override_locked, client_email"
    );

    if (deal_id) {
      query = query.eq("id", deal_id);
    } else if (email) {
      query = query.eq("client_email", email);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      searchError = "No deal found matching that ID or email.";
    } else {
      deal = data as Record<string, unknown>;
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-[#C6A55A] text-xl font-semibold tracking-wide uppercase">
            Founder Pricing Override
          </h1>
          <p className="text-white/40 text-xs mt-1">
            Restricted to founder_admin. All actions are logged.
          </p>
        </div>

        {/* Search form */}
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <input
            name="deal_id"
            defaultValue={deal_id ?? ""}
            placeholder="Deal ID"
            className="flex-1 rounded bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#C6A55A]/60"
          />
          <span className="text-white/30 text-xs self-center">or</span>
          <input
            name="email"
            defaultValue={email ?? ""}
            placeholder="Client email"
            className="flex-1 rounded bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#C6A55A]/60"
          />
          <button
            type="submit"
            className="bg-[#C6A55A] hover:bg-[#d4b46a] text-black text-xs font-semibold px-5 py-2 rounded transition-colors"
          >
            Search
          </button>
        </form>

        {searchError && (
          <p className="text-red-400 text-xs">{searchError}</p>
        )}

        {deal && (
          <div className="space-y-4">
            <div className="text-xs text-white/40 space-y-1">
              <p>Deal ID: <span className="text-white/70">{String(deal.id)}</span></p>
              <p>Client Email: <span className="text-white/70">{String(deal.client_email ?? "—")}</span></p>
              <p>Status: <span className="text-white/70">{String(deal.status ?? "—")}</span></p>
              <p>Payment Status: <span className="text-white/70">{String(deal.payment_status ?? "—")}</span></p>
            </div>

            <FounderDiscountOverridePanel
              dealId={String(deal.id)}
              currentAmount={Number(deal.amount ?? 0)}
              currentPaymentStatus={deal.payment_status as string | null}
              currentDealStatus={deal.status as string | null}
              role={role}
              existingDiscount={{
                discount_type: deal.discount_type as string | null,
                discount_amount: deal.discount_amount as number | null,
                discount_reason: deal.discount_reason as string | null,
                discount_note: deal.discount_note as string | null,
                founder_price_override: deal.founder_price_override as number | null,
                platform_fee_required: deal.platform_fee_required as number | null,
                service_fee_waived: deal.service_fee_waived as boolean | null,
                price_override_locked: deal.price_override_locked as boolean | null,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
