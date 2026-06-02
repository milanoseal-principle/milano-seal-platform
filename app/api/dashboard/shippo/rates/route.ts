import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleFromEmail } from "@/lib/rbac";
import { createShippoShipment } from "@/lib/shippo/client";
import { buildReturnAddress, buildRecipientAddressFromMatter, validateMilanoShippingAddress } from "@/lib/shippo/address";
import { buildDocumentParcel } from "@/lib/shippo/parcel";
import { requiresCustoms, buildDocumentCustomsPayload, getCustomsAdvisory } from "@/lib/shippo/customs";
import { createShippoCustomsItem, createShippoCustomsDeclaration } from "@/lib/shippo/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = roleFromEmail(user.email);
    if (role !== "operator" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { matter_id, parcel_override } = body;

    if (!matter_id) return NextResponse.json({ error: "matter_id required" }, { status: 400 });

    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({ error: "Shippo not configured" }, { status: 503 });
    }

    const { data: matter, error: mErr } = await supabase
      .from("deals")
      .select("id, client_name, email, phone, document_type, document_count, destination_country, country, shipping_street1, shipping_city, shipping_state, shipping_zip, apostille_required")
      .eq("id", matter_id)
      .single();

    if (mErr || !matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

    const recipient = buildRecipientAddressFromMatter(matter);
    const validationErrors = validateMilanoShippingAddress(recipient);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Invalid shipping address", details: validationErrors }, { status: 422 });
    }

    const parcel = parcel_override ?? buildDocumentParcel({ documentCount: matter.document_count ?? 1 });
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

    const sanitizedRates = shipment.rates.map((r) => ({
      rate_id: r.object_id,
      provider: r.provider,
      servicelevel_name: r.servicelevel.name,
      servicelevel_token: r.servicelevel.token,
      estimated_days: r.estimated_days ?? null,
      duration_terms: r.duration_terms ?? null,
      arrives_by: r.arrives_by ?? null,
    }));

    return NextResponse.json({
      success: true,
      shipment_id: shipment.object_id,
      rates: sanitizedRates,
      customs_required: needsCustoms,
      customs_advisory: needsCustoms ? getCustomsAdvisory(destCountry) : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
