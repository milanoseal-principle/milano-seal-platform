import { NextRequest, NextResponse } from "next/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildClientInvoiceSnapshot } from "@/lib/portalInvoice";
import { runGlobalAcceptanceReview } from "@/lib/milano-seal/global-acceptance/global-acceptance-engine";

export const runtime = "nodejs";

const INVOICE_SELECT = [
  "id",
  "deal_id",
  "document_type",
  "destination_country",
  "origin_state",
  "lane",
  "execution_lane",
  "execution_truth",
  "base_price",
  "docs_count",
  "signers",
  "witness_total",
  "apostille_required",
  "requires_apostille",
  "translation",
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
  "authentication_route",
  "authentication_route_status",
  "courier_required",
  "courier_pricing_status",
  "courier_carrier",
  "courier_service_level",
  "courier_provider_rate",
  "courier_tier_credit",
  "courier_client_charge",
  "courier_currency",
  "courier_estimated_days",
].join(",");

function executionTruth(row: Record<string, unknown>) {
  return row.execution_truth && typeof row.execution_truth === "object"
    ? (row.execution_truth as Record<string, unknown>)
    : {};
}

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
  const truth = executionTruth(invoiceRow);

  const routeReview = runGlobalAcceptanceReview({
    documentType: String(invoiceRow.document_type ?? ""),
    documentOriginState: String(invoiceRow.origin_state ?? "") || undefined,
    notaryState: String(truth.notary_jurisdiction ?? "") || undefined,
    signerLocationState: String(truth.signer_location ?? "") || undefined,
    destinationCountry: String(invoiceRow.destination_country ?? "") || undefined,
    ronRequested: truth.execution_method === "ron",
    apostilleRequested: Boolean(
      invoiceRow.apostille_required ?? invoiceRow.requires_apostille,
    ),
    translationNeeded:
      invoiceRow.translation === true
        ? true
        : invoiceRow.translation === false
          ? false
          : "unknown",
    operatorRole: "client",
  });

  const routeStatus = routeReview.blockedReasons.length
    ? "review_required"
    : routeReview.route === "non_hague_consular_legalization" ||
        routeReview.route === "federal_authentication" ||
        routeReview.requiresEmbassyReview
      ? "pending_authority_confirmation"
      : "ready";

  return NextResponse.json({
    success: true,
    invoice: buildClientInvoiceSnapshot({
      ...invoiceRow,
      authentication_route: routeReview.route,
      authentication_route_status: routeStatus,
    }),
  });
}
