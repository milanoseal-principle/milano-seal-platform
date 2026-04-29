import { createAdminClient } from "@/lib/supabase/admin";

export interface CommissionRecord {
  deal_id: string;
  partner_id: string;
  partner_name: string;
  deal_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: "pending" | "approved" | "paid";
}

// Commission rates by partner type
const COMMISSION_RATES: Record<string, number> = {
  attorney: 0.1, // 10% for attorney referrals
  partner: 0.08, // 8% for registered partners
  staff: 0.05, // 5% for internal staff (Tiffany)
  default: 0.05,
};

export function calculateCommission(
  dealAmount: number,
  partnerType: keyof typeof COMMISSION_RATES = "default"
): number {
  const rate = COMMISSION_RATES[partnerType] ?? COMMISSION_RATES.default;
  return parseFloat((dealAmount * rate).toFixed(2));
}

export async function createCommission(
  dealId: string,
  dealAmount: number,
  partnerId: string,
  partnerName: string,
  partnerType: string = "default"
): Promise<{ ok: boolean; commission?: CommissionRecord; error?: string }> {
  const supabase = createAdminClient();
  const rate = COMMISSION_RATES[partnerType] ?? COMMISSION_RATES.default;
  const amount = calculateCommission(dealAmount, partnerType);

  const record: Omit<CommissionRecord, "status"> & { status: string } = {
    deal_id: dealId,
    partner_id: partnerId,
    partner_name: partnerName,
    deal_amount: dealAmount,
    commission_rate: rate,
    commission_amount: amount,
    status: "pending",
  };

  const { error } = await supabase.from("commissions").insert(record);
  if (error) return { ok: false, error: error.message };

  return { ok: true, commission: { ...record, status: "pending" } };
}

export async function getCommissionSummary(partnerId?: string) {
  const supabase = createAdminClient();
  let query = supabase.from("commissions").select("*");
  if (partnerId) query = query.eq("partner_id", partnerId);

  const { data, error } = await query;
  if (error || !data)
    return { total_owed: 0, total_paid: 0, pending_count: 0, records: [] };

  const pending = data.filter((c) => c.status === "pending");
  const paid = data.filter((c) => c.status === "paid");

  return {
    total_owed: pending.reduce((s, c) => s + (c.commission_amount || 0), 0),
    total_paid: paid.reduce((s, c) => s + (c.commission_amount || 0), 0),
    pending_count: pending.length,
    records: data,
  };
}
