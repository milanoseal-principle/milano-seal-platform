import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { recordSecurityEvent } from "@/lib/security/security-events";
import { getLedger } from "@/lib/custodyLedger";
import {
  projectMatterForPortal,
  PORTAL_BLOCKED_FIELDS,
} from "@/lib/portalProjection";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const PORTAL_SAFE_FIELDS = new Set([
  "id",
  "display_id",
  "matter_id",
  "client_name",
  "document_type",
  "destination_country",
  "assigned_lane",
  "matter_status",
  "client_facing_status",
  "payment_status",
  "payment_disposition",
  "comp_authorized",
  "payment_amount_due",
  "amount_due",
  "payment_confirmed",
  "paid_at",
  "currency",
  "invoice_status",
  "wise_reference",
  "wise_payment_url",
  "is_platform_fee_only",
  "original_total",
  "discount_amount",
  "discount_value",
  "final_total",
  "courtesy_applied",
  "courtesy_label",
  "courier_tracking_id",
  "courier_carrier",
  "delivery_status",
  "delivery_eta",
  "delivery_timestamp",
  "is_paid_and_released",
  "created_at",
  "updated_at",
]);

function isPlatformFeeOnly(record: Record<string, unknown>): boolean {
  return record.discount_type === "platform_fee_only";
}

function applySafeProjection(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const key of PORTAL_SAFE_FIELDS) {
    if (key in record) safe[key] = record[key];
  }
  for (const field of PORTAL_BLOCKED_FIELDS) {
    delete safe[field as string];
  }
  return safe;
}

function pricingTruthForPortal(record: Record<string, unknown>) {
  const projected = projectMatterForPortal(record as never);
  return applySafeProjection(projected as unknown as Record<string, unknown>);
}

export async function GET(req: NextRequest) {
  const ctx = await getAllClientDeals();
  if (!ctx) {
    await recordSecurityEvent({
      event_name: "UNAUTHORIZED_PORTAL_ACCESS_ATTEMPT",
      severity: "warning",
      route: "/api/portal/me",
      client_safe: false,
      metadata: { reason: "unauthenticated" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.deals.length) {
    return NextResponse.json({
      success: true,
      matters: [],
      deal: null,
      ledger: [],
      message:
        "No matter is linked to this account yet. Contact your coordinator if you believe this is a mistake.",
    });
  }

  const dealId = req.nextUrl.searchParams.get("deal_id");
  const activeDeal =
    (dealId ? ctx.deals.find((d) => d.id === dealId) : null) ?? ctx.deals[0];

  if (!activeDeal) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: safeView } = await admin
    .from("client_safe_matter_view")
    .select(
      "matter_id, display_id, client_name, document_type, destination_country, assigned_lane, matter_status, client_facing_status, payment_status, payment_disposition, comp_authorized, payment_amount_due, payment_confirmed, paid_at, currency, invoice_status, wise_reference, wise_payment_url, courier_tracking_id, courier_carrier, delivery_status, delivery_eta, delivery_timestamp, is_paid_and_released, created_at, updated_at",
    )
    .eq("matter_id", activeDeal.id)
    .single();

  const activePricingTruth = pricingTruthForPortal(
    activeDeal as unknown as Record<string, unknown>,
  );

  let safeMatter: Record<string, unknown>;
  if (safeView) {
    safeMatter = {
      ...applySafeProjection(safeView as Record<string, unknown>),
      ...activePricingTruth,
    };
  } else {
    safeMatter = applySafeProjection({
      ...(activeDeal as unknown as Record<string, unknown>),
      ...activePricingTruth,
    });
  }
  safeMatter.is_platform_fee_only = isPlatformFeeOnly(
    activeDeal as unknown as Record<string, unknown>,
  );

  const { data: timelineRows } = await admin
    .from("client_safe_timeline_view")
    .select(
      "event_id, event_label, public_description, timestamp_recorded",
    )
    .eq("matter_id", activeDeal.id)
    .order("timestamp_recorded", { ascending: false })
    .limit(20);

  const ledger = await getLedger(activeDeal.id);

  let legacyCredit: {
    credit_name: string;
    discount_percent: number;
    applies_to: string;
    client_safe_note: string;
    status: string;
  } | null = null;
  try {
    const { data: creditRow } = await admin
      .from("legacy_client_credits")
      .select(
        "credit_name, discount_percent, applies_to, client_safe_note, status",
      )
      .eq("matter_id", activeDeal.id)
      .eq("status", "active")
      .maybeSingle();
    if (creditRow) {
      legacyCredit = {
        credit_name: String(creditRow.credit_name ?? ""),
        discount_percent: Number(creditRow.discount_percent ?? 50),
        applies_to: String(creditRow.applies_to ?? "service_fee_only"),
        client_safe_note: String(creditRow.client_safe_note ?? ""),
        status: "active",
      };
    }
  } catch {
    // Optional legacy table; absence must not block the portal.
  }

  const matters = ctx.deals.map((d) => {
    const projected = applySafeProjection(
      projectMatterForPortal(d) as unknown as Record<string, unknown>,
    );
    projected.is_platform_fee_only = isPlatformFeeOnly(
      d as unknown as Record<string, unknown>,
    );
    return projected;
  });

  if (legacyCredit) {
    safeMatter.legacy_client_credit = legacyCredit;
  }

  return NextResponse.json({
    success: true,
    matters,
    deal: safeMatter,
    ledger,
    timeline: timelineRows ?? [],
    coordinator: {
      organization: "The Milano Seal",
      contact: "Nicholas Milano, Founder",
    },
  });
}
