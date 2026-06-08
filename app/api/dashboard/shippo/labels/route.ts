import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleFromEmail } from "@/lib/rbac";
import { purchaseShippoLabel, registerShippoTrackingWebhook } from "@/lib/shippo/client";
import { assertCanCreateLabel, ShippoGateError } from "@/lib/shippo/gates";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = roleFromEmail(user.email);
    if (!["founder_admin", "admin_operator"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({ error: "Shippo not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { matter_id, selected_rate_id, shipment_id } = body;

    if (!matter_id || !selected_rate_id) {
      return NextResponse.json({ error: "matter_id and selected_rate_id required" }, { status: 400 });
    }

    const { data: matter, error: mErr } = await supabase
      .from("deals")
      .select("id, payment_status, paid_and_released, matter_status, apostille_required, shipping_street1, document_type, client_name, destination_country, country")
      .eq("id", matter_id)
      .single();

    if (mErr || !matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

    try {
      assertCanCreateLabel({
        payment_status: matter.payment_status,
        paid_and_released: matter.paid_and_released,
        matter_status: matter.matter_status,
        apostille_required: matter.apostille_required,
        shipping_address: matter.shipping_street1,
      });
    } catch (gateErr) {
      if (gateErr instanceof ShippoGateError) {
        return NextResponse.json({ error: gateErr.message, code: gateErr.code }, { status: 422 });
      }
      throw gateErr;
    }

    // Purchase label — label_url stored server-side only, never returned to client
    const transaction = await purchaseShippoLabel(selected_rate_id);

    if (transaction.status !== "SUCCESS") {
      return NextResponse.json({ error: "Label purchase failed", messages: transaction.messages }, { status: 502 });
    }

    const carrier = body.selected_carrier ?? "unknown";
    const trackingNumber = transaction.tracking_number;
    const trackingUrl = transaction.tracking_url_provider ?? null;

    // Package template and shipping option — default to folder_packet / included
    const packageTemplateId = body.package_template_id ?? "milano_folder_packet";
    const shippingOptionId = body.shipping_option_id ?? "milano_international_release";

    // Register tracking webhook
    if (trackingNumber) {
      try {
        await registerShippoTrackingWebhook(carrier, trackingNumber, matter_id);
      } catch {
        // Webhook registration failure must not block label creation
      }
    }

    // Persist to shippo_shipments — label_url and actual_shippo_cost stored server-side only
    const { error: insertErr } = await supabase.from("shippo_shipments").insert({
      matter_id,
      shippo_shipment_id: shipment_id ?? null,
      shippo_transaction_id: transaction.object_id,
      shippo_rate_id: selected_rate_id,
      carrier,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      label_url: transaction.label_url, // operator-only, never exposed via portal API
      label_file_type: "PDF",
      shippo_status: transaction.status,
      courier_status: "LABEL_CREATED",
      label_created_at: new Date().toISOString(),
      tracking_registered_at: trackingNumber ? new Date().toISOString() : null,
      created_by: user.id,
      // Packaging policy fields
      package_template_id: packageTemplateId,
      shipping_option_id: shippingOptionId,
      tax_id_policy: "NO_TAX_ID",
      carrier_policy_status: "APPROVED",
      packaging_qa_status: "PENDING",
      actual_shippo_cost: null, // populated by rate data if available; internal only
      shippo_currency: "USD",
    });

    if (insertErr) {
      console.error("shippo_shipments insert error:", insertErr.message);
    }

    // Ledger events
    await audit({
      event: "courier.label.created",
      actor: user.email,
      resource: `matter:${matter_id}`,
      payload: {
        matter_id,
        tracking_number: trackingNumber,
        carrier,
        package_template_id: packageTemplateId,
        shipping_option_id: shippingOptionId,
        action: "created",
        status: "success",
        actorKind: "operator",
        events: [
          "SHIPPO_RATE_SELECTED",
          "COURIER_LABEL_CREATED",
          "COURIER_TRACKING_REGISTERED",
          "PACKAGE_PROFILE_SELECTED",
          "SHIPPING_OPTION_SELECTED",
        ],
      },
    });

    return NextResponse.json({
      success: true,
      shipment_id: shipment_id ?? null,
      carrier,
      tracking_number_display: trackingNumber,
      tracking_url: trackingUrl,
      courier_status: "LABEL_CREATED",
      label_created_at: new Date().toISOString(),
      package_template_used: packageTemplateId,
      shipping_option_used: shippingOptionId,
      // label_url never returned — stored internally
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
