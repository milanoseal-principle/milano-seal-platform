import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CERTIFICATION_STEPS, computeCertificationStatus } from "@/lib/alliance/partnerCertification";

export const dynamic = "force-dynamic";

const ALLIANCE_ROLES = ["founder_admin", "alliance", "alliance_partner", "alliance_member"];

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined) ??
    "";
  if (!ALLIANCE_ROLES.includes(role)) return null;
  return { user, supabase };
}

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, supabase } = auth;

  try {
    const { data: rows, error } = await supabase
      .from("partner_certifications")
      .select("step, status, completed_at, operator_confirmed, operator_confirmed_at")
      .eq("partner_id", user.id);

    if (error) {
      // Graceful on missing table
      const isTableMissing =
        error.message?.includes("does not exist") ||
        error.code === "42P01";
      if (isTableMissing) {
        return NextResponse.json({
          steps: CERTIFICATION_STEPS,
          completedStepIds: [],
          status: "ROUTING_LOCKED",
          table_missing: true,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const completedStepIds = (rows ?? [])
      .filter((r) => r.status === "complete")
      .map((r) => r.step);

    const certStatus = computeCertificationStatus(completedStepIds);

    return NextResponse.json({
      steps: CERTIFICATION_STEPS,
      completedStepIds,
      status: certStatus,
      rows: rows ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to load certifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, supabase } = auth;

  let body: { step?: string; attestation_text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { step, attestation_text } = body;
  if (!step || !attestation_text) {
    return NextResponse.json({ error: "step and attestation_text are required" }, { status: 400 });
  }

  const validStep = CERTIFICATION_STEPS.find((s) => s.id === step);
  if (!validStep) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  try {
    // Upsert: insert if not exists, update if pending
    const { error: upsertError } = await supabase
      .from("partner_certifications")
      .upsert(
        {
          partner_id: user.id,
          step,
          status: "complete",
          completed_at: new Date().toISOString(),
          attested_text: attestation_text,
        },
        {
          onConflict: "partner_id,step",
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      const isTableMissing =
        upsertError.message?.includes("does not exist") ||
        upsertError.code === "42P01";
      if (isTableMissing) {
        return NextResponse.json({ error: "Certification table not yet initialized" }, { status: 503 });
      }
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Return updated state
    const { data: rows } = await supabase
      .from("partner_certifications")
      .select("step, status, completed_at, operator_confirmed, operator_confirmed_at")
      .eq("partner_id", user.id);

    const completedStepIds = (rows ?? [])
      .filter((r) => r.status === "complete")
      .map((r) => r.step);

    return NextResponse.json({
      steps: CERTIFICATION_STEPS,
      completedStepIds,
      status: computeCertificationStatus(completedStepIds),
      rows: rows ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to complete step" }, { status: 500 });
  }
}
