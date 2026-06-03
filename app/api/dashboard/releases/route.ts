export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("deals")
    .select("id, destination_country, document_type, matter_status, updated_at, is_paid_and_released, payment_status")
    .or(
      "is_paid_and_released.eq.true,matter_status.in.(courier_ready,shipped,delivered,completed,apostille_processing)",
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];

  function daysSince(dateStr: string) {
    return Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  function mapRow(r: typeof rows[0]) {
    return {
      id: r.id,
      destination_country: r.destination_country,
      document_type: r.document_type,
      matter_status: r.matter_status,
      updated_at: r.updated_at,
      days_in_state: daysSince(r.updated_at as string),
    };
  }

  const ready_for_release = rows
    .filter((r) => r.matter_status === "courier_ready" && !r.is_paid_and_released && r.payment_status === "paid")
    .map(mapRow);

  const waiting_approval = rows
    .filter((r) => r.matter_status === "courier_ready" && !r.is_paid_and_released && r.payment_status !== "paid")
    .map(mapRow);

  const waiting_courier = rows
    .filter((r) => r.matter_status === "courier_ready" && r.is_paid_and_released)
    .map(mapRow);

  const waiting_verification = rows
    .filter((r) => r.matter_status === "shipped")
    .map(mapRow);

  const completed = rows
    .filter((r) => r.matter_status === "delivered" || r.matter_status === "completed")
    .map(mapRow);

  return NextResponse.json({
    ready_for_release,
    waiting_approval,
    waiting_courier,
    waiting_verification,
    completed,
  });
}
