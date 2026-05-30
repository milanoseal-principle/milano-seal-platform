import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PortalDeal {
  id: string;
  client_name: string | null;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  destination_country: string | null;
  country: string | null;
  status: string | null;
  payment_status: string | null;
  amount: number | null;
  invoice_subtotal: number | null;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  tracking_number: string | null;
  carrier: string | null;
  delivery_status: string | null;
  delivery_eta: string | null;
  delivery_timestamp: string | null;
  signed_by: string | null;
  ship_to: Record<string, unknown> | null;
  evidence_url: string | null;
  evidence_generated_at: string | null;
  created_at: string | null;
}

export async function getAllClientDeals(): Promise<{
  email: string;
  deals: PortalDeal[];
} | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const email = user.email.toLowerCase();
  const admin = createAdminClient();
  const { data } = await admin
    .from("deals")
    .select("id, client_name, email, phone, document_type, destination_country, country, status, payment_status, amount, invoice_subtotal, invoice_retainer, invoice_balance, tracking_number, carrier, delivery_status, delivery_eta, delivery_timestamp, signed_by, ship_to, evidence_url, evidence_generated_at, created_at")
    .ilike("email", email)
    .order("created_at", { ascending: false });

  return { email, deals: (data as PortalDeal[]) ?? [] };
}

export async function getCurrentClientDeal(dealId?: string | null): Promise<{
  email: string;
  deal: PortalDeal | null;
} | null> {
  const ctx = await getAllClientDeals();
  if (!ctx) return null;
  if (dealId) {
    const deal = ctx.deals.find((d) => d.id === dealId) ?? null;
    return { email: ctx.email, deal };
  }
  return { email: ctx.email, deal: ctx.deals[0] ?? null };
}
