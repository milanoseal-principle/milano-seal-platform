import { NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeReadinessFromMatter, toClientSummary } from "@/lib/executionReadiness";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getAllClientDeals();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = ctx.deals[0] ?? null;
  if (!raw) {
    return NextResponse.json({ readiness: null });
  }

  // Fetch full matter fields needed for readiness computation
  const admin = createAdminClient();
  const { data } = await admin
    .from("deals")
    .select("matter_status, payment_status, is_paid_and_released, destination_country, document_type")
    .eq("id", raw.id)
    .single();

  if (!data) {
    return NextResponse.json({ readiness: null });
  }

  const result = computeReadinessFromMatter({
    matter_status: (data.matter_status as string | null) ?? (data as Record<string, unknown>).status as string | null,
    payment_status: data.payment_status as string | null,
    is_paid_and_released: !!(data.is_paid_and_released as boolean | null),
    destination_country: data.destination_country as string | null,
    document_type: data.document_type as string | null,
  });

  if (!result) {
    return NextResponse.json({ readiness: null });
  }

  return NextResponse.json({ readiness: toClientSummary(result) });
}
