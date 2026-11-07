import { emailsMatch, normalizeEmail } from "@/lib/auth/clientAccount";
import { readAppRole } from "@/lib/auth/server-role";
import { isRouteAllowedForRole } from "@/lib/auth/roleRedirect";
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
  payment_confirmed: boolean | null;
  amount: number | null;
  amount_due: number | null;
  payment_amount_received: number | null;
  invoice_subtotal: number | null;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  original_total: number | null;
  final_total: number | null;
  discount_code: string | null;
  discount_value: number | null;
  discount_amount: number | null;
  wise_reference: string | null;
  payment_link: string | null;
  currency: string | null;
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
  is_paid_and_released: boolean | null;
}

export async function getAllClientDeals(
  dependencies = { session: createServerClient, admin: createAdminClient },
): Promise<{
  email: string;
  deals: PortalDeal[];
} | null> {
  const supabase = await dependencies.session();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (
    !user?.email ||
    !user.email_confirmed_at ||
    !isRouteAllowedForRole("/portal", readAppRole(user))
  )
    return null;

  const email = normalizeEmail(user.email);
  const emailPattern = email.replace(/[\\%_]/g, "\\$&");
  const admin = dependencies.admin();
  const { data } = await admin
    .from("deals")
    .select(
      "id, client_name, email, phone, document_type, destination_country, country, status, payment_status, payment_confirmed, amount, amount_due, payment_amount_received, invoice_subtotal, invoice_retainer, invoice_balance, original_total, final_total, discount_code, discount_value, discount_amount, wise_reference, payment_link, currency, tracking_number, carrier, delivery_status, delivery_eta, delivery_timestamp, signed_by, ship_to, evidence_url, evidence_generated_at, created_at",
    )
    .ilike("email", emailPattern)
    .order("created_at", { ascending: false });

  // Pattern matching is a query optimization, never ownership authority.
  // Exact normalized comparison also rejects PostgREST wildcard aliases and
  // any unexpected candidate row before it can reach a portal response.
  const deals = ((data as PortalDeal[]) ?? []).filter((deal) =>
    emailsMatch(deal.email, email),
  );
  return { email, deals };
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
