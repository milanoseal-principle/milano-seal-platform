import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeProfessionalProfileInput,
  professionalMatterDefaults,
} from "@/lib/professional/profile";
import { PROFESSIONAL_PROFILE_COLUMNS, requireProfessional } from "@/lib/professional/server";

export const runtime = "nodejs";

export async function GET() {
  const context = await requireProfessional();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });
  return NextResponse.json({
    profile: context.profile,
    defaults: professionalMatterDefaults(context.profile),
  });
}

// Professionals may edit firm details and reusable defaults. Email, status and
// user binding are operator-controlled and are never taken from the request.
export async function PATCH(request: Request) {
  const context = await requireProfessional();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = normalizeProfessionalProfileInput({ ...body, email: context.profile.email });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { email: _email, ...editable } = parsed.profile;
  void _email;
  const { data, error } = await createAdminClient()
    .from("professional_profiles")
    .update({ ...editable, updated_at: new Date().toISOString() })
    .eq("id", context.profile.id)
    .eq("user_id", context.userId)
    .select(PROFESSIONAL_PROFILE_COLUMNS)
    .single();
  if (error) return NextResponse.json({ error: "Profile update failed." }, { status: 500 });

  return NextResponse.json({ profile: data });
}
