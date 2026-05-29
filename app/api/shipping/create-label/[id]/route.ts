import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createShipment,
  buyLabelWithFailover,
  selectRate,
  applyMargin,
  enforceSLA,
  validateAddress,
  ShippoAddress,
  ShippoParcel,
} from "@/lib/shippo";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { sendWhatsApp, sendAdminAlert } from "@/lib/whatsapp";
import { logActivity } from "@/lib/activity";
import { snapshotDeal } from "@/lib/dealBackup";

export const runtime = "nodejs";

interface Body {
  from: ShippoAddress;
  to: ShippoAddress;
  parcel?: ShippoParcel;
  parcels?: ShippoParcel[];
  declared_value?: number;
  urgent?: boolean;
  signature_required?: boolean;
  skip_address_validation?: boolean;
  skip_sla?: boolean;
  test_mode?: boolean;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: deal_id } = await params;
  const supabase = createAdminClient();

  const { data: deal, error: dealErr } = await supabase
    .from("deals")
    .select("*")
    .eq("id", deal_id)
    .single();

  if (dealErr || !deal) {
    return NextResponse.json(
      { error: "Deal not found", details: dealErr?.message },
      { status: 404 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parcels: ShippoParcel[] = Array.isArray(body.parcels)
    ? body.parcels
    : body.parcel
      ? [body.parcel]
      : [];

  if (!body?.from || !body?.to || parcels.length === 0) {
    return NextResponse.json(
      { error: "Missing required fields: from, to, parcel(s)" },
      { status: 400 },
    );
  }

  // test_mode is explicitly rejected in production.
  // In development only, it returns a safe stub without mutating deal state.
  if (body.test_mode) {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Live shipping provider is not configured." },
        { status: 501 }
      );
    }
    // Development stub — no deal state mutation, no fake tracking persistence
    return NextResponse.json({
      success: false,
      error: "test_mode is available in development only. Configure SHIPPO_API_KEY for live labels.",
      test_mode: true,
    }, { status: 501 });
  }

  try {
    const validation_warnings: { side: "to" | "from"; messages: string[] }[] =
      [];
    if (!body.skip_address_validation) {
      const fallback = {
        is_valid: true,
        messages: [] as { text: string }[],
      };
      const [toCheck, fromCheck] = await Promise.all([
        validateAddress(body.to).catch(() => fallback),
        validateAddress(body.from).catch(() => fallback),
      ]);
      if (!toCheck.is_valid) {
        return NextResponse.json(
          {
            error: "Destination address failed validation",
            messages: toCheck.messages?.map((m) => m.text) ?? [],
            hint: "Pass skip_address_validation=true to override.",
          },
          { status: 400 },
        );
      }
      if (toCheck.messages?.length) {
        validation_warnings.push({
          side: "to",
          messages: toCheck.messages.map((m) => m.text),
        });
      }
      if (!fromCheck.is_valid && fromCheck.messages?.length) {
        validation_warnings.push({
          side: "from",
          messages: fromCheck.messages.map((m) => m.text),
        });
      }
    }

    const shipment = await createShipment({
      from: { email: "contact@themilanoseal.com", ...body.from },
      to: body.to,
      parcel: parcels[0],
    });

    if (parcels.length > 1) {
      console.warn(
        `[shipping/create-label] ${parcels.length} parcels requested — only the first was sent to Shippo. Extend createShipment for true multi-parcel.`,
      );
    }

    if (!shipment.rates || shipment.rates.length === 0) {
      return NextResponse.json(
        { error: "No rates returned from carrier API" },
        { status: 502 },
      );
    }

    const decision = selectRate(shipment.rates, {
      destination_country:
        deal.destination_country || deal.country || "United States",
      urgent:
        body.urgent ??
        (deal.execution_lane === "executive" ||
          deal.execution_lane === "Executive"),
      signature_required: body.signature_required,
    });

    if (!body.skip_sla) {
      try {
        enforceSLA(decision.chosen, deal);
      } catch (slaErr) {
        const msg = slaErr instanceof Error ? slaErr.message : String(slaErr);
        return NextResponse.json(
          {
            error: msg,
            code: "SLA_VIOLATION",
            hint: "Pass skip_sla=true to override.",
            decision,
          },
          { status: 422 },
        );
      }
    }

    const pricing = applyMargin(decision.chosen, {
      tier: deal.execution_lane,
      destination_country:
        deal.destination_country || deal.country || "United States",
      declared_value: body.declared_value,
    });

    const purchase = await buyLabelWithFailover(decision);
    const tx = purchase.transaction;

    const carrier = (
      tx.tracking_provider || purchase.used_rate.carrier
    ).toLowerCase();
    const updates = {
      shipment_id: shipment.object_id,
      tracking_number: tx.tracking_number,
      carrier,
      label_url: tx.label_url,
      rate_amount: pricing.cost,
      rate_currency: purchase.used_rate.currency,
      rate_sell_price: pricing.sell_price,
      rate_margin: pricing.margin,
      ship_from: body.from,
      ship_to: body.to,
      delivery_status: "in_transit",
      delivery_eta: tx.eta ?? null,
      status: "shipped",
      deal_status: "shipped",
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase.from("deals").update(updates).eq("id", deal_id);

    await supabase.from("shipping_analytics").insert({
      deal_id,
      carrier,
      service_level: purchase.used_rate.service,
      cost: pricing.cost,
      sell_price: pricing.sell_price,
      margin: pricing.margin,
      estimated_days: purchase.used_rate.days,
      decision: {
        chosen: decision.chosen,
        cheapest: decision.cheapest,
        fastest: decision.fastest,
        used: purchase.used_rate,
        attempts: purchase.attempts,
        pool_size: decision.pool.length,
        validation_warnings,
        parcels_requested: parcels.length,
        signature_required: !!body.signature_required,
        declared_value: body.declared_value ?? null,
        insurance_added: pricing.insurance_added,
      },
    });

    await appendLedger({
      deal_id,
      event: CUSTODY_EVENTS.DOC_LABEL_CREATED,
      actor_type: "system",
      location: "Origin Facility",
      method: "shipment",
      status: "transferred",
      metadata: {
        carrier,
        tracking_number: tx.tracking_number,
        label_url: tx.label_url,
        cost: pricing.cost,
        sell_price: pricing.sell_price,
        used_rate: purchase.used_rate,
        attempts: purchase.attempts,
      },
    });
    await appendLedger({
      deal_id,
      event: CUSTODY_EVENTS.DOC_SHIPPED,
      actor_type: "system",
      location: "Origin Facility",
      method: "shipment",
      status: "transferred",
      metadata: {
        carrier,
        tracking_number: tx.tracking_number,
      },
    });

    if (deal.phone) {
      void sendWhatsApp(
        deal.phone,
        `Milano Seal: your documents have been shipped!\n\nCarrier: ${carrier.toUpperCase()}\nTracking: ${tx.tracking_number}\n\nYou can track your shipment and view your matter status in your client portal.`,
        { dealId: deal_id },
      ).catch(() => {});
    }
    void sendAdminAlert(
      `Label purchased · ${carrier.toUpperCase()} · ${tx.tracking_number} · $${pricing.sell_price}`,
    ).catch(() => {});

    await logActivity({
      deal_id,
      action: "shipped",
      detail: `Label purchased via ${carrier.toUpperCase()} (${tx.tracking_number})${
        purchase.attempts > 1 ? ` after ${purchase.attempts} attempts` : ""
      }`,
      meta: {
        carrier,
        tracking_number: tx.tracking_number,
        cost: pricing.cost,
        sell_price: pricing.sell_price,
        attempts: purchase.attempts,
      },
    });

    void snapshotDeal({
      deal_id,
      trigger: "shipment",
      deal: { ...deal, ...updates },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      tracking_number: tx.tracking_number,
      carrier,
      label_url: tx.label_url,
      eta: tx.eta,
      pricing,
      decision,
      attempts: purchase.attempts,
      validation_warnings,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[shipping/create-label] error:", msg);
    return NextResponse.json(
      { error: "Shipping label creation failed", details: msg },
      { status: 500 },
    );
  }
}
