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
import { calculateCourierCharge } from "@/lib/shippo/courierCredit";

export const dynamic = "force-dynamic";

async function loadMatter(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matterId: string,
) {
  const fields = [
    "id",
    "deal_id",
    "client_name",
    "email",
    "phone",
    "document_type",
    "document_count",
    "docs_count",
    "destination_country",
    "country",
    "shipping_street1",
    "shipping_street2",
    "shipping_city",
    "shipping_state",
    "shipping_zip",
    "shipping_country",
    "apostille_required",
    "payment_status",
    "payment_confirmed",
    "payment_observed_at",
    "amount_due",
    "amount_paid",
    "lane",
    "status",
  ].join(",");

  const byId = await supabase
    .from("deals")
    .select(fields)
    .eq("id", matterId)
    .maybeSingle();
  if (byId.data) return byId;

  return supabase
    .from("deals")
    .select(fields)
    .eq("deal_id", matterId)
    .maybeSingle();
}

function pricingMutable(matter: Record<string, unknown>): boolean {
  return (
    !matter.payment_observed_at &&
    matter.payment_confirmed !== true &&
    !["paid", "confirmed", "payment_confirmed", "deposit_paid"].includes(
      String(matter.payment_status ?? "unpaid").toLowerCase(),
    )
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = roleFromEmail(user.email);
    if (!["founder_admin", "admin_operator"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { matter_id, parcel_override, package_template_override } = body;

    if (!matter_id) {
      return NextResponse.json({ error: "matter_id required" }, { status: 400 });
    }

    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({ error: "Shippo not configured" }, { status: 503 });
    }

    const { data: matter, error: matterError } = await loadMatter(
      supabase,
      matter_id,
    );
    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const recipient = buildRecipientAddressFromMatter({
      ...matter,
      destination_country:
        matter.shipping_country ?? matter.destination_country ?? matter.country,
    });
    const validationErrors = validateMilanoShippingAddress(recipient);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "SHIPPING_ADDRESS_REVIEW_REQUIRED",
          details: validationErrors,
        },
        { status: 422 },
      );
    }

    const lane = String(matter.lane ?? "Signature");
    const packageTemplate = selectPackageTemplate({
      lane,
      documentCount: matter.document_count ?? matter.docs_count ?? 1,
      operatorOverride: package_template_override,
    });

    const parcel =
      parcel_override ?? buildDocumentParcel({ templateId: packageTemplate.id });
    const destinationCountry =
      matter.shipping_country ?? matter.destination_country ?? matter.country ?? "US";

    let customsDeclarationId: string | undefined;
    const needsCustoms = requiresCustoms(destinationCountry);
    if (needsCustoms) {
      const { item: itemPayload, declaration: declarationPayload } =
        await buildDocumentCustomsPayload(matter);
      const itemResult = await createShippoCustomsItem(itemPayload);
      const declarationResult = await createShippoCustomsDeclaration({
        ...declarationPayload,
        items: [itemResult.object_id],
      });
      customsDeclarationId = declarationResult.object_id;
    }

    const addressFrom = buildReturnAddress();
    const shipment = await createShippoShipment({
      address_from: addressFrom,
      address_to: recipient,
      parcels: [parcel],
      ...(customsDeclarationId
        ? { customs_declaration: customsDeclarationId }
        : {}),
      async: false,
    });

    const approvedRates = filterApprovedRates(shipment.rates);
    const rankedRates = rankApprovedRates({
      rates: approvedRates,
      lane,
      destinationCountry,
    });

    const sanitizedRates = rankedRates.map(
      ({ rate, rank, recommended, selectionPolicy, selectionReason }) => ({
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
          tier: lane,
        }),
        amount: rate.amount,
        currency: rate.currency,
      }),
    );

    const recommendation = sanitizedRates[0] ?? null;

    return NextResponse.json({
      success: true,
      matter_id: matter.id,
      matter_reference: matter.deal_id ?? matter.id,
      execution_lane: lane,
      shipment_id: shipment.object_id,
      rates: sanitizedRates,
      recommended_rate: recommendation,
      auto_selection_available: Boolean(recommendation),
      pricing_mutable: pricingMutable(matter as Record<string, unknown>),
      pricing_mutation_locked_reason: pricingMutable(
        matter as Record<string, unknown>,
      )
        ? null
        : "WISE_SUBMISSION_ALREADY_IN_MOTION",
      package_template_used: packageTemplate.id,
      shipping_option_used: "milano_international_release",
      customs_required: needsCustoms,
      customs_declaration_id: customsDeclarationId ?? null,
      customs_advisory: needsCustoms
        ? getCustomsAdvisory(destinationCountry)
        : null,
      quote_context: {
        address_from: addressFrom,
        address_to: recipient,
        parcel,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
