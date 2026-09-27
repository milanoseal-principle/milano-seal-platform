import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOperatorOrFounder } from "@/lib/security/access-control";
import { isProfileId } from "@/lib/professional/referral";

export const runtime = "nodejs";

// Operator activation is the only path to a professional login. It invites the
// profile email, stamps app_metadata.role='professional' (service role only)
// and binds the profile to that user id. An existing account that already
// holds another role is never re-roled.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user: operator },
  } = await supabase.auth.getUser();
  if (!operator || !isOperatorOrFounder(operator.app_metadata?.role as string | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!isProfileId(id)) return NextResponse.json({ error: "Invalid profile id." }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("professional_profiles")
    .select("id,email,status,user_id")
    .eq("id", id)
    .maybeSingle();
  if (profileError || !profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  let userId = profile.user_id as string | null;
  if (userId) {
    const { data: linkedUser, error: linkedUserError } = await admin.auth.admin.getUserById(userId);
    if (linkedUserError || !linkedUser?.user) {
      return NextResponse.json(
        { error: "The linked Milano account could not be verified.", code: "PROFESSIONAL_ACCOUNT_INVALID" },
        { status: 409 },
      );
    }
    const linkedRole = linkedUser.user.app_metadata?.role;

  if (userId) {
    const { data: linked, error: linkedError } = await admin.auth.admin.getUserById(userId);
    const linkedUser = linked?.user ?? null;
    if (linkedError || !linkedUser) {
      return NextResponse.json(
        { error: "The linked Milano account could not be verified.", code: "PROFESSIONAL_LINKED_ACCOUNT_INVALID" },
        { status: 409 },
      );
    }

    if (
      linkedUser.email?.trim().toLowerCase() !== String(profile.email).trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: "The linked Milano account does not match this professional profile.", code: "PROFESSIONAL_ACCOUNT_MISMATCH" },
        { status: 409 },
      );
    }

    const linkedRole = linkedUser.app_metadata?.role;
    if (linkedRole && linkedRole !== "professional") {
      return NextResponse.json(
        { error: "This email already holds another Milano role.", code: "PROFESSIONAL_ROLE_CONFLICT" },
        { status: 409 },
      );
    }
    if (linkedRole !== "professional") {
      const { error: roleError } = await admin.auth.admin.updateUserById(userId, {
        app_metadata: { ...linkedUser.user.app_metadata, role: "professional" },

    if (linkedRole !== "professional") {
      const { error: roleError } = await admin.auth.admin.updateUserById(linkedUser.id, {
        app_metadata: { ...linkedUser.app_metadata, role: "professional" },
      });
      if (roleError) return NextResponse.json({ error: "Role assignment failed." }, { status: 500 });
    }
  }

  if (!userId) {
    const origin = new URL(request.url).origin;
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      String(profile.email),
      { redirectTo: `${origin}/auth/callback?next=/professional/matters` },
    );
    if (inviteError || !invited?.user) {
      return NextResponse.json(
        {
          error:
            "Invitation failed. If this email already has a Milano account, it must be reviewed before it can hold the professional role.",
          code: "PROFESSIONAL_INVITE_FAILED",
        },
        { status: 409 },
      );
    }
    const existingRole = invited.user.app_metadata?.role;
    if (existingRole && existingRole !== "professional") {
      return NextResponse.json(
        { error: "This email already holds another Milano role.", code: "PROFESSIONAL_ROLE_CONFLICT" },
        { status: 409 },
      );
    }
    const { error: roleError } = await admin.auth.admin.updateUserById(invited.user.id, {
      app_metadata: { ...invited.user.app_metadata, role: "professional" },
    });
    if (roleError) return NextResponse.json({ error: "Role assignment failed." }, { status: 500 });
    userId = invited.user.id;
  }

  const { error: updateError } = await admin
    .from("professional_profiles")
    .update({ status: "active", user_id: userId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: "Activation failed." }, { status: 500 });

  return NextResponse.json({ ok: true, profile_id: id, status: "active" });
}
