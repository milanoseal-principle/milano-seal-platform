import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST as canonicalIntakePost } from "@/app/api/intake/route";
import {
  PROFESSIONAL_MATTER_COLUMNS,
  RECEIVING_AUTHORITY_DISCLAIMER,
  projectMatterForProfessional,
  type ProfessionalMatterSource,
} from "@/lib/professional/matterProjection";
import {
  buildProfessionalIntakePayload,
  normalizeProfessionalMatterSubmission,
} from "@/lib/professional/handoff";
import { professionalCanSubmit } from "@/lib/professional/profile";
import { createReferralReference } from "@/lib/professional/referral";
import { requireProfessional } from "@/lib/professional/server";

export const runtime = "nodejs";

// Authorized Matter list: only Matters linked to the signed-in professional's
// own profile, projected through the client-safe professional view.
export async function GET() {
  const context = await requireProfessional();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });

  const { data, error } = await createAdminClient()
    .from("deals")
    .select(PROFESSIONAL_MATTER_COLUMNS.join(","))
    .eq("professional_profile_id", context.profile.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: "Matters are unavailable right now." }, { status: 500 });

  const matters = ((data ?? []) as unknown as ProfessionalMatterSource[])
    .filter((row) => row.professional_profile_id === context.profile.id)
    .map(projectMatterForProfessional);
  return NextResponse.json({ matters, acceptance_notice: RECEIVING_AUTHORITY_DISCLAIMER });
}

// PROFESSIONAL SUBMITS FOR CLIENT: creates the Matter through the canonical
// intake (no parallel Matter system). Professional Matters enter operator
// review; the quote and Wise deposit follow the canonical gates.
export async function POST(request: NextRequest) {
  const context = await requireProfessional();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });
  if (!professionalCanSubmit(context.profile)) {
    return NextResponse.json({ error: "Professional profile is not active." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = normalizeProfessionalMatterSubmission(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let referralReference: string;
  try {
    referralReference = createReferralReference(context.profile.id, "submitted");
  } catch {
    return NextResponse.json({ error: "Professional submission is unavailable right now." }, { status: 503 });
  }

  const payload = buildProfessionalIntakePayload({
    submission: parsed.submission,
    profile: context.profile,
    referralReference,
  });
  const intakeRequest = new NextRequest(new URL("/api/intake", request.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const response = await canonicalIntakePost(intakeRequest);
  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    return NextResponse.json(
      { error: typeof result.error === "string" ? result.error : "Matter intake failed." },
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    matter_reference: result.deal_id ?? null,
    referral_reference: referralReference,
    stage: "Under review",
    message: "Matter received. The Milano Seal will review it and issue a Matter-specific quote.",
    acceptance_notice: RECEIVING_AUTHORITY_DISCLAIMER,
  });
}
