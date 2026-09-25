import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeProfessionalProfileInput } from "@/lib/professional/profile";

export const runtime = "nodejs";

const RECEIVED_MESSAGE =
  "Professional profile received. The Milano Seal will review it and send account access to the email provided.";

// Public "CREATE PROFESSIONAL PROFILE". Creates a prospect profile only; it
// grants no account, no role and no Matter visibility. Operator activation is
// the only path to a professional login. Enumeration-safe: an existing email is
// never overwritten and the response is identical either way.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = normalizeProfessionalProfileInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: existing, error: lookupError } = await admin
      .from("professional_profiles")
      .select("id")
      .eq("email", parsed.profile.email)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (!existing) {
      const { error: insertError } = await admin
        .from("professional_profiles")
        .insert({ ...parsed.profile, status: "prospect" });
      // A concurrent insert for the same email resolves to the same record.
      if (insertError && insertError.code !== "23505") throw insertError;
    }

    return NextResponse.json({ ok: true, message: RECEIVED_MESSAGE });
  } catch (error) {
    console.error("[professional/profile] create failed", error);
    return NextResponse.json(
      { ok: false, error: "We couldn't save the profile right now. Please try again." },
      { status: 500 },
    );
  }
}
