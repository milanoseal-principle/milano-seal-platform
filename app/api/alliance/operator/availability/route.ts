import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { persistEligibilityCheck } from "@/lib/alliance/operatorEligibilityGate";

export const runtime = "nodejs";

type AvailabilityState =
  | "AVAILABLE"
  | "BUSY"
  | "OFFLINE"
  | "AFTER_HOURS"
  | "RUSH_ONLY"
  | "TRAVELING"
  | "PAUSED"
  | "LOCKED";

const VALID_STATES: AvailabilityState[] = [
  "AVAILABLE", "BUSY", "OFFLINE", "AFTER_HOURS",
  "RUSH_ONLY", "TRAVELING", "PAUSED", "LOCKED",
];

// POST /api/alliance/operator/availability — update availability state
export async function POST(req: NextRequest) {
  const admin = createAdminClient();

  let body: { operator_id?: string; availability?: string; reason?: string; set_by?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { operator_id, availability, reason, set_by = "operator" } = body;

  if (!operator_id || !availability) {
    return NextResponse.json(
      { error: "operator_id and availability are required" },
      { status: 422 },
    );
  }

  if (!VALID_STATES.includes(availability as AvailabilityState)) {
    return NextResponse.json(
      { error: `Invalid availability state: ${availability}` },
      { status: 422 },
    );
  }

  const { data, error } = await admin
    .from("operator_availability_log")
    .insert({
      operator_id,
      availability,
      set_by,
      reason: reason ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Re-evaluate eligibility when availability changes
  let eligibility = null;
  try {
    eligibility = await persistEligibilityCheck(operator_id);
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ availability_log: data, eligibility });
}

// GET /api/alliance/operator/availability — get current availability
export async function GET(req: NextRequest) {
  const admin = createAdminClient();
  const operatorId = req.nextUrl.searchParams.get("operator_id");

  if (!operatorId) {
    return NextResponse.json({ error: "operator_id is required" }, { status: 422 });
  }

  const { data, error } = await admin
    .from("operator_current_availability")
    .select("availability, set_by, reason, created_at")
    .eq("operator_id", operatorId)
    .single();

  if (error || !data) {
    return NextResponse.json({ availability: "OFFLINE" });
  }

  return NextResponse.json({ availability: data });
}
