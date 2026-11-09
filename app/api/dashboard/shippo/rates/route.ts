import {projectShippingMatter} from '@/lib/shippo/address';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {resolveServerRole} from '@/lib/auth/server-role';
import {
  createShippoCustomsDeclaration,
  createShippoCustomsItem,
  createShippoShipment,
  getShippoShipment,
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
import { calculateCourierCharge } from "@/lib/shippo/courierCredit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

async function loadMatter(supabase: Awaited<ReturnType<typeof createClient>>, matterId: string) {
  const fields = "id, deal_id, client_name, email, phone, document_type, docs_count,ship_to,destination_country,execution_tier,lane, apostille_required, payment_status, payment_observed_at, amount_due, amount_paid,status";

  const byId = await supabase.from("deals").select(fields).eq("id", matterId).maybeSingle();
  if (byId.data) return {...byId,data:projectShippingMatter(byId.data)};

  const result=await supabase.from("deals").select(fields).eq("deal_id",matterId).maybeSingle();return {...result,data:result.data?projectShippingMatter(result.data):null};
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await resolveServerRole(user);
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
    const destCountry = matter.shipping_country ?? matter.destination_country ?? matter.country ?? "US";

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
      courier_pricing: calculateCourierCharge({
        providerRateAmount: rate.amount,
        currency: rate.currency,
        tier: matter.tier,
      }),
      ...(["founder_admin", "admin_operator"].includes(role) ? { amount: rate.amount, currency: rate.currency } : {}),
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

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await resolveServerRole(user);
    if (!["founder_admin", "admin_operator"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { matter_id, shipment_id, selected_rate_id } = await req.json();
    if (!matter_id || !shipment_id || !selected_rate_id) {
      return NextResponse.json({ error: "matter_id, shipment_id, and selected_rate_id required" }, { status: 400 });
    }
    if (!process.env.SHIPPO_API_KEY) return NextResponse.json({ error: "Shippo not configured" }, { status: 503 });

    const { data: matter, error: matterError } = await loadMatter(supabase, matter_id);
    if (matterError || !matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

    const admin = createAdminClient();
    const { data: exactExisting, error: existingError } = await admin
      .from("shippo_shipments")
      .select("*")
      .eq("matter_id", matter.id)
      .eq("shippo_shipment_id", shipment_id)
      .maybeSingle();
    if (existingError) return NextResponse.json({ error: "RATE_SNAPSHOT_LOOKUP_FAILED" }, { status: 500 });
    let existing = exactExisting;
    if (!existing) {
      const { data: priorSelection, error: priorError } = await admin
        .from("shippo_shipments")
        .select("*")
        .eq("matter_id", matter.id)
        .in("rate_status", ["SHIPPING_RATE_SELECTED", "SHIPPING_ADJUSTMENT_REQUIRED"])
        .order("rate_selected_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (priorError) return NextResponse.json({ error: "RATE_SNAPSHOT_LOOKUP_FAILED" }, { status: 500 });
      existing = priorSelection;
    }

    const paymentObserved = Boolean((matter as { payment_observed_at?: string | null }).payment_observed_at);
    if (paymentObserved) {
      if (existing?.shippo_rate_id === selected_rate_id) {
        return NextResponse.json({
          success: true,
          existing: true,
          matter_id: matter.id,
          shipment: {
            id: existing.id,
            shippo_shipment_id: existing.shippo_shipment_id,
            shippo_rate_id: existing.shippo_rate_id,
            carrier: existing.carrier,
            service_level: existing.service_level,
            provider_rate_amount: existing.provider_rate_amount,
            tier_courier_credit: existing.tier_courier_credit,
            client_courier_charge: existing.client_courier_charge,
            rate_currency: existing.rate_currency,
            rate_status: existing.rate_status,
          },
        });
      }
      if (existing?.id) {
        await admin.from("shippo_shipments").update({ rate_status: "SHIPPING_ADJUSTMENT_REQUIRED" }).eq("id", existing.id);
      }
      return NextResponse.json({ error: "SHIPPING_ADJUSTMENT_REQUIRED" }, { status: 409 });
    }

    const shipment = await getShippoShipment(shipment_id);
    const approved = filterApprovedRates(shipment.rates);
    const selected = approved.find((rate) => rate.object_id === selected_rate_id);
    if (!selected) return NextResponse.json({ error: "SHIPPO_RATE_UNAVAILABLE" }, { status: 422 });

    const destinationCountry = matter.shipping_country ?? matter.destination_country ?? matter.country ?? "US";
    const ranked = rankApprovedRates({ rates: approved, lane: matter.tier, destinationCountry });
    const rankedSelection = ranked.find(({ rate }) => rate.object_id === selected_rate_id);
    const pricing = calculateCourierCharge({ providerRateAmount: selected.amount, currency: selected.currency, tier: matter.tier });
    const selectedAt = new Date().toISOString();
    const snapshot = {
      matter_id: matter.id,
      shippo_shipment_id: shipment_id,
      shippo_rate_id: selected.object_id,
      provider_rate_amount: pricing.providerRateAmount,
      tier_courier_credit: pricing.tierCourierCredit,
      client_courier_charge: pricing.clientCourierCharge,
      rate_currency: pricing.currency,
      carrier: selected.provider,
      service_level: selected.servicelevel.name,
      selected_service_level: selected.servicelevel.token,
      selection_policy: rankedSelection?.selectionPolicy ?? "OPERATOR_CONFIRMED",
      selection_reason: rankedSelection?.selectionReason ?? "Operator selected an approved carrier rate.",
      rate_selected_at: selectedAt,
      rate_status: "SHIPPING_RATE_SELECTED",
      selected_by: user.id,
      updated_at: selectedAt,
    };
    const pricingSnapshotHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
    const write = existing?.id
      ? await admin.from("shippo_shipments").update({ ...snapshot, pricing_snapshot_hash: pricingSnapshotHash }).eq("id", existing.id).select().single()
      : await admin.from("shippo_shipments").insert({ ...snapshot, pricing_snapshot_hash: pricingSnapshotHash, created_by: user.id }).select().single();
    if (write.error) return NextResponse.json({ error: "RATE_SNAPSHOT_PERSIST_FAILED" }, { status: 500 });

    return NextResponse.json({
      success: true,
      existing: Boolean(existing),
      matter_id: matter.id,
      shipment: {
        id: write.data.id,
        shippo_shipment_id: write.data.shippo_shipment_id,
        shippo_rate_id: write.data.shippo_rate_id,
        carrier: write.data.carrier,
        service_level: write.data.service_level,
        provider_rate_amount: write.data.provider_rate_amount,
        tier_courier_credit: write.data.tier_courier_credit,
        client_courier_charge: write.data.client_courier_charge,
        rate_currency: write.data.rate_currency,
        rate_status: write.data.rate_status,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
