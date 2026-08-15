import { NextResponse } from "next/server";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import {
  operationalClientName,
  operationalDestinationCountry,
  operationalMatterDisplayId,
  resolveOperationalMatterState,
  type OperationalMatterSourceRow,
} from "@/lib/matter/canonicalOperationalRead";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CourierMatterRow extends OperationalMatterSourceRow {
  id: string;
  deal_id?: string | null;
}

const ACTIVE_STATES = new Set([
  "label_created",
  "in_transit",
  "customs_watch",
  "out_for_delivery",
]);

const ACTIVE_DELIVERY_STATUSES = new Set([
  "in_transit",
  "out_for_delivery",
  "failed",
  "exception",
  "returned",
  "return_to_sender",
]);

export async function GET() {
  await requireDashboardAccess();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, deal_id, client_name, full_name, destination_country, country, status, deal_status, carrier, tracking_number, delivery_status, delivery_eta, delivery_timestamp, delivery_at, shipped_at, updated_at, due_at, sla_deadline",
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[courier/active] canonical read failed:", error.message);
    return NextResponse.json(
      { error: "COURIER_READ_FAILED", shipments: [], deliveredLast7Days: 0 },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as unknown as CourierMatterRow[];
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const projected = rows.map((row) => {
    const resolution = resolveOperationalMatterState(row);
    const deliveryStatus = row.delivery_status?.trim().toLowerCase() ?? null;
    return {
      id: row.id,
      deal_id: operationalMatterDisplayId(row),
      client_name: operationalClientName(row),
      destination_country: operationalDestinationCountry(row),
      carrier: row.carrier ?? null,
      tracking_number: row.tracking_number ?? null,
      delivery_status: deliveryStatus,
      delivery_eta: row.delivery_eta ?? null,
      shipped_at: row.shipped_at ?? row.delivery_at ?? null,
      canonical_state: resolution.state,
      raw_state: resolution.rawState,
      alias_applied: resolution.aliasApplied,
      due_at: row.due_at ?? row.sla_deadline ?? null,
      delivery_timestamp: row.delivery_timestamp ?? row.delivery_at ?? null,
    };
  });

  const shipments = projected.filter((row) => {
    if (row.canonical_state && ACTIVE_STATES.has(row.canonical_state)) return true;
    if (row.delivery_status && ACTIVE_DELIVERY_STATUSES.has(row.delivery_status)) return true;
    return false;
  });

  const deliveredLast7Days = projected.filter((row) => {
    const delivered =
      row.canonical_state === "delivered" ||
      row.canonical_state === "completed" ||
      row.delivery_status === "delivered";
    if (!delivered || !row.delivery_timestamp) return false;
    const timestamp = new Date(row.delivery_timestamp).getTime();
    return Number.isFinite(timestamp) && timestamp >= sevenDaysAgo && timestamp <= now;
  }).length;

  return NextResponse.json({
    shipments,
    deliveredLast7Days,
    generatedAt: new Date().toISOString(),
  });
}
