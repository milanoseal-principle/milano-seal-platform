import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateLegalization } from "@/lib/tools/executionTools";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: string =
    profile?.role ??
    (user.app_metadata?.role as string) ??
    (user.app_metadata?.role as string) ??
    "";

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { country?: string; document_type?: string; apostille_required?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.country) {
    return NextResponse.json(
      { error: "country is required" },
      { status: 422 },
    );
  }

  const result = validateLegalization({
    country: body.country,
    document_type: body.document_type,
    apostille_required: body.apostille_required,
  });
  return NextResponse.json(result);
}
