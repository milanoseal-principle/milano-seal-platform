import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleFromEmail } from "@/lib/rbac";
import {
  createShippoCustomsDeclaration,
  createShippoCustomsItem,
  createShippoShipment,
} from "@/lib/shippo/client";
import {
  buildReturnAddress,
  buildRecipientAddressFromMatter,
  validateMilanoShippingAddress,
} from "@/lib/shippo/address";
import { buildDocumentParcel, selectPackageTemplate } from "@/lib/shippo/parcel";
import {
  requiresCustoms,
  buildDocumentCustomsPayload,
  getCustomsAdvisory,
} from "@/lib/shippo/customs";
import { filterApprovedRates } from "@/lib/shippo/carrierPolicy";
import { rankApprovedRates } from "@/lib/shippo/rateSelection";
import { assertPaymentConfirmed, PaymentGateError } from "@/lib/payments/paymentGate";

export const dynamic = "force-dynamic";

async function loadMatter(supabase: Awaited<ReturnType<typeof createClient>>, matterId: string) {
  const fields = "id, deal_id, client_name, email, phone, document_type, document_count, destination_country, country, shipping_street1, shipping_city, shipping_state, shipping_zip, apostille_required, payment_status, amount_due, amount_paid, tier, status";

  const byId = await supabase.from("deals").select(fields).eq("id", matterId).maybeSingle();
  if (byId.data) return byId;

  return supabase.from("deals").select(fields).eq("deal_id", matterId).maybeSingle();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = roleFromEmail(user.email);
    if (!["founder_admin", "admin_operator"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { matter_id, parcel_override, package_template_override } = body;

    if (!matter_id) return NextResponse.json({ error: "matter_id required" }, { status: 400 });

    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({ error: "Shippo not configured" }, { status: 503 });
    }

    const { data: matter, error: mErr } = await loadMatter(supabase, matter_id);
    if (mErr || !matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

    try {
      assertPaymentConfirmed(matter, "rate_preview");
    } catch (err) {
      const code = err instanceof PaymentGateError ? err.code : "PAYMENT_REQUIRED";
      return NextResponse.json({ error: code, message: "Payment must be confirmed before rate preview." }, { status: 402 });
    }

    const recipient = buildRecipientAddressFromMatter(matter);
    const validationErrors = validateMilanoShippingAddress(recipient);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Invalid shipping address", details: validationErrors }, { status: 422 });
    }

    const packageTemplate = selectPackageTemplate({
      lane: matter.tier ?? undefined,
      documentCount: matter.document_count ?? 1,
      operatorOverride: package_template_override,
    });

    const parcel = parcel_override ?? buildDocumentParcel({ templateId: packageTemplate.id });
    const destCountry = matter.destination_country ?? matter.country ?? "US";

    let customsDeclarationId: string | undefined;
    const needsCustoms = requiresCustoms(destCountry);
    if (needsCustoms) {
      const { item: itemPayload, declaration: declPayload } = await buildDocumentCustomsPayload(matter);
      const itemRes = await createShippoCustomsItem(itemPayload);
      const declRes = await createShippoCustomsDeclaration({ ...declPayload, items: [itemRes.object_id] });
      customsDeclarationId = declRes.object_id;
    }

    const shipment = await createShippoShipment({
      address_from: buildReturnAddress(),
      address_to: recipient,
      parcels: [parcel],
      ...(customsDeclarationId ? { customs_declaration: customsDeclarationId } : {}),
      async: false,
    });

    const approvedRates = filterApprovedRates(shipment.rates);
    const rankedRates = rankApprovedRates({
      rates: approvedRates,
      lane: matter.tier,
      destinationCountry: destCountry,
    });

    const sanitizedRates = rankedRates.map(({ rate, rank, recommended, selectionPolicy, selectionReason }) => ({
      rate_id: rate.object_id,
      provider: rate.provider,
      servicelevel_name: rate.servicelevel.name,
      servicelevel_token: rate.servicelevel.token,
      estimated_days: rate.estimated_days ?? null,
      duration_terms: rate.duration_terms ?? null,
      arrives_by: rate.arrives_by ?? null,
      rank,
      recommended,
      selection_policy: selectionPolicy,
      selection_reason: selectionReason,
      ...( ["founder_admin", "admin_operator"].includes(role) ? { amount: rate.amount, currency: rate.currency } : {}),
    }));

    const recommendation = sanitizedRates[0] ?? null;

    return NextResponse.json({
      success: true,
      matter_id: matter.id,
      matter_reference: matter.deal_id ?? matter.id,
      execution_lane: matter.tier ?? "signature",
      shipment_id: shipment.object_id,
      rates: sanitizedRates,
      recommended_rate: recommendation,
      auto_selection_available: Boolean(recommendation),
      package_template_used: packageTemplate.id,
      shipping_option_used: "milano_international_release",
      customs_required: needsCustoms,
      customs_advisory: needsCustoms ? getCustomsAdvisory(destCountry) : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
