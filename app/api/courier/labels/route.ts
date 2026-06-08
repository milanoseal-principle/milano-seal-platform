import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buyLabel,
  createShipment,
  selectRate,
  normalizeRates,
  ShippoAddress,
  ShippoParcel,
} from "@/lib/shippo";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["founder_admin", "admin_operator"]);

const BLOCKED_STATUSES = new Set(["cancelled", "refunded"]);

interface Body {
  matter_id: string;
  shipment_id?: string;
  rate_id: string;
  from: ShippoAddress;
  to: ShippoAddress;
  parcel: ShippoParcel;
  declared_value?: number;
  signature_required?: boolean;
  skip_release_gate?: boolean;
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.matter_id || !body.rate_id || !body.from || !body.to || !body.parcel) {
    return NextResponse.json(
      { error: "Missing required fields: matter_id, rate_id, from, to, parcel" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Fetch deal
  const { data: deal, error: dealErr } = await admin
    .from("deals")
    .select("*")
    .eq("id", body.matter_id)
    .single();

  if (dealErr || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Release gate check
  if (!body.skip_release_gate) {
    if (BLOCKED_STATUSES.has(deal.deal_status)) {
      return NextResponse.json(
        {
          error: "Release gate: label purchase blocked",
          reason: `Deal status is '${deal.deal_status}'. Cannot purchase label for cancelled or refunded deals.`,
          code: "RELEASE_GATE_BLOCKED",
        },
        { status: 422 },
      );
    }

    // Payment confirmation gate: label cannot be purchased until payment is confirmed and balance is zero
    if (deal.payment_status !== "payment_confirmed") {
      return NextResponse.json(
        {
          error: "Release gate: payment not confirmed",
          reason: `Payment status is '${deal.payment_status ?? "unpaid"}'. Label purchase requires payment_status = payment_confirmed.`,
          code: "PAYMENT_NOT_CONFIRMED",
        },
        { status: 422 },
      );
    }

    if (deal.balance_due !== null && deal.balance_due > 0) {
      return NextResponse.json(
        {
          error: "Release gate: balance outstanding",
          reason: `Balance due is ${deal.balance_due}. Label purchase blocked until balance_due = 0.`,
          code: "BALANCE_OUTSTANDING",
        },
        { status: 422 },
      );
    }

    // Execution complete gate: deal must be past in_execution
    const EXECUTION_COMPLETE_STATUSES = new Set([
      "apostille_processing",
      "courier_ready",
      "shipped",
      "delivered",
      "completed",
      "closed",
    ]);
    if (!EXECUTION_COMPLETE_STATUSES.has(deal.deal_status ?? "")) {
      return NextResponse.json(
        {
          error: "Release gate: execution not complete",
          reason: `Deal status is '${deal.deal_status ?? "unknown"}'. Label purchase requires execution to be complete (status must be apostille_processing or beyond).`,
          code: "EXECUTION_NOT_COMPLETE",
        },
        { status: 422 },
      );
    }

    // Apostille gate: if apostille is in progress, block until complete
    if (deal.deal_status === "apostille_processing") {
      // Only block if deal explicitly still has apostille in progress
      // courier_ready means apostille is done and package is cleared
      return NextResponse.json(
        {
          error: "Release gate: apostille still pending",
          reason: "Apostille processing is active. Label purchase is unlocked once status reaches courier_ready.",
          code: "APOSTILLE_PENDING",
        },
        { status: 422 },
      );
    }

    // Shipping address gate
    const hasAddress =
      deal.ship_to ||
      (deal.address_line1 && deal.city) ||
      (deal.to_address_json);
    if (!hasAddress) {
      return NextResponse.json(
        {
          error: "Release gate: shipping address missing",
          reason: "No delivery address is on file for this matter. Add a shipping address before purchasing a label.",
          code: "ADDRESS_MISSING",
        },
        { status: 422 },
      );
    }
  } else {
    // Log explicit override
    await appendLedger({
      deal_id: body.matter_id,
      event: CUSTODY_EVENTS.RELEASE_GATE_OVERRIDE,
      actor_type: "operator",
      actor_id: user.id,
      notes: `Release gate bypassed by operator (skip_release_gate=true). Deal status: ${deal.deal_status}`,
      metadata: { operator_id: user.id, deal_status: deal.deal_status },
    });
  }

  // Warn (don't block) if deal is not in 'shipped' status
  const gateWarning =
    deal.deal_status !== "shipped"
      ? `Warning: deal status is '${deal.deal_status}', not 'shipped'. Label will be purchased anyway.`
      : null;

  try {
    let transaction;
    let usedCarrier: string;
    let usedRateId: string = body.rate_id;

    if (body.shipment_id) {
      // Use provided rate_id directly — skip createShipment
      transaction = await buyLabel(body.rate_id);
    } else {
      // Create shipment first, then find matching rate or buy directly
      const shipment = await createShipment({
        from: body.from,
        to: body.to,
        parcel: body.parcel,
      });

      if (!shipment.rates || shipment.rates.length === 0) {
        return NextResponse.json(
          { error: "No rates returned from carrier API" },
          { status: 502 },
        );
      }

      // Try to match the requested rate_id in the new shipment's rates
      const matchedRate = shipment.rates.find((r) => r.object_id === body.rate_id);
      if (matchedRate) {
        transaction = await buyLabel(matchedRate.object_id);
        usedRateId = matchedRate.object_id;
      } else {
        // Fall back to selecting best rate from new shipment
        const decision = selectRate(shipment.rates, {
          destination_country:
            deal.destination_country || deal.country || "United States",
          signature_required: body.signature_required,
        });
        transaction = await buyLabel(decision.chosen.id);
        usedRateId = decision.chosen.id;
      }
    }

    const status = (transaction.status ?? "").toUpperCase();
    if (status && status !== "SUCCESS" && status !== "QUEUED" && status !== "WAITING") {
      const msg =
        transaction.messages?.map((m: { text: string }) => m.text).join("; ") ||
        `Shippo returned status=${transaction.status}`;
      return NextResponse.json(
        { error: "Label purchase failed", details: msg },
        { status: 502 },
      );
    }

    usedCarrier = (
      transaction.tracking_provider || ""
    ).toLowerCase() || "unknown";

    // Store to deals
    const shippedAt = new Date().toISOString();
    const updates = {
      carrier: usedCarrier,
      tracking_number: transaction.tracking_number,
      label_url: transaction.label_url,
      tracking_url_provider: transaction.tracking_url_provider ?? null,
      rate_id: usedRateId,
      delivery_eta: transaction.eta ?? null,
      delivery_status: "in_transit",
      status: "shipped",
      deal_status: "shipped",
      shipped_at: shippedAt,
      updated_at: shippedAt,
    };

    await admin.from("deals").update(updates).eq("id", body.matter_id);

    // Custody ledger
    await appendLedger({
      deal_id: body.matter_id,
      event: CUSTODY_EVENTS.DOC_LABEL_CREATED,
      actor_type: "operator",
      actor_id: user.id,
      location: "Origin Facility",
      method: "shipment",
      status: "label_purchased",
      metadata: {
        carrier: usedCarrier,
        tracking_number: transaction.tracking_number,
        rate_id: usedRateId,
        skip_release_gate: body.skip_release_gate ?? false,
      },
    });

    await appendLedger({
      deal_id: body.matter_id,
      event: CUSTODY_EVENTS.DOC_SHIPPED,
      actor_type: "operator",
      actor_id: user.id,
      location: "Origin Facility",
      method: "shipment",
      status: "transferred",
      metadata: {
        carrier: usedCarrier,
        tracking_number: transaction.tracking_number,
      },
    });

    // Return — no label_url, no margin in response
    return NextResponse.json({
      success: true,
      tracking_number: transaction.tracking_number,
      carrier: usedCarrier,
      eta: transaction.eta ?? null,
      tracking_url_provider: transaction.tracking_url_provider ?? null,
      ...(gateWarning ? { warning: gateWarning } : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Label purchase failed", details: msg },
      { status: 500 },
    );
  }
}
