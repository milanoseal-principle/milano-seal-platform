import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { getLedger } from "@/lib/custodyLedger";
import { projectMatterForPortal, PORTAL_BLOCKED_FIELDS } from "@/lib/portalProjection";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Hard-coded allowlist of fields that may appear in any portal response.
// Nothing outside this list ever leaves this route.
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
  "payment_amount_due",
  "payment_confirmed",
  "paid_at",
  "currency",
  "invoice_status",
  "wise_reference",
  "wise_payment_url",
  "is_platform_fee_only",
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

function applySafeProjection(record: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const key of PORTAL_SAFE_FIELDS) {
    if (key in record) safe[key] = record[key];
  }
  // Defensive: also strip any blocked fields that slipped through
  for (const field of PORTAL_BLOCKED_FIELDS) {
    delete safe[field as string];
  }
  return safe;
}

export async function GET(req: NextRequest) {
  // 1. Verify authenticated session
  const ctx = await getAllClientDeals();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. No matters on file — safe empty state
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

  // 3. Try to pull from client_safe_matter_view first (preferred source)
  const admin = createAdminClient();
  const { data: safeView } = await admin
    .from("client_safe_matter_view")
    .select("matter_id, display_id, client_name, document_type, destination_country, assigned_lane, matter_status, client_facing_status, payment_status, payment_amount_due, payment_confirmed, paid_at, currency, invoice_status, wise_reference, wise_payment_url, courier_tracking_id, courier_carrier, delivery_status, delivery_eta, delivery_timestamp, is_paid_and_released, created_at, updated_at")
    .eq("matter_id", activeDeal.id)
    .single();

  // 4. Build the client-safe payload
  let safeMatter: Record<string, unknown>;
  if (safeView) {
    safeMatter = applySafeProjection(safeView as Record<string, unknown>);
  } else {
    // Fallback: project from raw deal with strict allowlist
    const projected = projectMatterForPortal(activeDeal);
    safeMatter = applySafeProjection(projected as unknown as Record<string, unknown>);
  }
  safeMatter.is_platform_fee_only = isPlatformFeeOnly(activeDeal as unknown as Record<string, unknown>);

  // 5. Fetch client-safe timeline events
  const { data: timelineRows } = await admin
    .from("client_safe_timeline_view")
    .select("event_id, event_label, public_description, timestamp_recorded")
    .eq("matter_id", activeDeal.id)
    .order("timestamp_recorded", { ascending: false })
    .limit(20);

  // 6. Fetch custody ledger (already client-safe)
  const ledger = await getLedger(activeDeal.id);

  // 7. Build matter list for portal switcher (safe projection only)
  const matters = ctx.deals.map((d) => {
    const projected = applySafeProjection(
      projectMatterForPortal(d) as unknown as Record<string, unknown>,
    );
    projected.is_platform_fee_only = isPlatformFeeOnly(d as unknown as Record<string, unknown>);
    return projected;
  });

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
