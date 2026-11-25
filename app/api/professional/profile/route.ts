import { NextResponse } from "next/server";
import { guardPublicEndpoint } from "@/lib/security/publicEndpointGuard";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeProfessionalProfileInput } from "@/lib/professional/profile";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 24_000;

const RECEIVED_MESSAGE =
  "Professional profile received. The Milano Seal will review it and send account access to the email provided.";

// Public "CREATE PROFESSIONAL PROFILE". Creates a prospect profile only; it
// grants no account, no role and no Matter visibility. Operator activation is
// the only path to a professional login. Enumeration-safe: an existing email is
// never overwritten and the response is identical either way.
export async function POST(request: Request) {
  const refusal = await guardPublicEndpoint(request, "public_signup");
  if (refusal) return refusal;
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  const tooLarge = () => NextResponse.json({ ok: false, error: "Profile payload is too large." }, { status: 413 });
  if (declaredSize > MAX_BODY_BYTES) return tooLarge();
  const raw = await request.text().catch(() => "");
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return tooLarge();
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error("Invalid profile");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
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
