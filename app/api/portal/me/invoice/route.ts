import { NextRequest, NextResponse } from "next/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildClientInvoiceSnapshot } from "@/lib/portalInvoice";

export const runtime = "nodejs";

const INVOICE_SELECT = [
  "id",
  "deal_id",
  "document_type",
  "destination_country",
  "lane",
  "execution_lane",
  "base_price",
  "docs_count",
  "signers",
  "witness_total",
  "apostille_required",
  "requires_apostille",
  "urgency",
  "internal_notes",
  "original_total",
  "eligible_subtotal",
  "non_discountable_total",
  "discount_code",
  "discount_value",
  "discount_amount",
  "final_total",
  "total_price",
  "invoice_subtotal",
  "invoice_retainer",
  "invoice_balance",
  "amount_due",
  "amount_paid",
  "payment_amount_received",
  "payment_status",
  "payment_confirmed",
  "currency",
  "payment_link",
  "payment_reference",
  "wise_reference",
].join(",");

export async function GET(req: NextRequest) {
  const requestedId = req.nextUrl.searchParams.get("deal_id");
  const ctx = await getCurrentClientDeal(requestedId);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .select(INVOICE_SELECT)
    .eq("id", ctx.deal.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invoice unavailable" }, { status: 500 });
  }

  const invoiceRow = data as unknown as Record<string, unknown>;

  return NextResponse.json({
    success: true,
    invoice: buildClientInvoiceSnapshot(invoiceRow),
  });
}