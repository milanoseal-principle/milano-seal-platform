export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import {
  operationalDestinationCountry,
  operationalDocumentType,
  operationalMatterDisplayId,
  resolveOperationalMatterState,
  type OperationalMatterSourceRow,
} from "@/lib/matter/canonicalOperationalRead";
import { createAdminClient } from "@/lib/supabase/admin";

interface ReleaseSourceRow extends OperationalMatterSourceRow {
  id: string;
  deal_id?: string | null;
  final_total?: number | string | null;
  total_price?: number | string | null;
}

function daysSince(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}

export async function GET() {
  await requireDashboardAccess();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .select(
      "id, deal_id, client_name, full_name, destination_country, country, document_type, document, service_type, status, deal_status, updated_at, created_at, payment_status, payment_confirmed, is_paid_and_released, tracking_number, carrier, delivery_status, delivery_timestamp, delivered_at, final_total, total_price",
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[releases] canonical read failed:", error.message);
    return NextResponse.json(
      { error: "RELEASE_READ_FAILED", message: error.message },
      { status: 500 },
    );
  }

  const rows = ((data ?? []) as unknown as ReleaseSourceRow[]).map((row) => {
    const resolution = resolveOperationalMatterState(row);
    return {
      id: row.id,
      deal_id: operationalMatterDisplayId(row),
      client_name: row.client_name ?? row.full_name ?? "Matter",
      destination_country: operationalDestinationCountry(row) ?? "Unknown destination",
      document_type: operationalDocumentType(row) ?? "Unknown document",
      matter_status: resolution.state ?? resolution.rawState ?? "unresolved",
      canonical_state: resolution.state,
      raw_state: resolution.rawState,
      alias_applied: resolution.aliasApplied,
      updated_at: row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
      days_in_state: daysSince(row.updated_at ?? row.created_at),
      payment_status: row.payment_status ?? "unknown",
      payment_confirmed: row.payment_confirmed === true,
      is_paid_and_released: row.is_paid_and_released === true,
      tracking_number: row.tracking_number ?? null,
      carrier: row.carrier ?? null,
      delivery_status: row.delivery_status ?? null,
      delivery_timestamp: row.delivery_timestamp ?? null,
    };
  });

  const ready_for_release = rows.filter(
    (row) => row.canonical_state === "ready_for_release",
  );

  const waiting_approval = rows.filter((row) =>
    [
      "final_balance_due",
      "final_payment_pending_review",
      "final_payment_confirmed",
    ].includes(row.canonical_state ?? ""),
  );

  const waiting_courier = rows.filter((row) =>
    ["final_packet_assembled", "label_created"].includes(
      row.canonical_state ?? "",
    ),
  );

  const waiting_verification = rows.filter((row) =>
    ["in_transit", "customs_watch", "out_for_delivery"].includes(
      row.canonical_state ?? "",
    ),
  );

  const completed = rows.filter((row) =>
    ["delivered", "completed"].includes(row.canonical_state ?? ""),
  );

  const unresolved = rows.filter(
    (row) => row.canonical_state === null && row.raw_state !== null,
  );

  return NextResponse.json({
    ready_for_release,
    waiting_approval,
    waiting_courier,
    waiting_verification,
    completed,
    unresolved,
    generatedAt: new Date().toISOString(),
  });
}
