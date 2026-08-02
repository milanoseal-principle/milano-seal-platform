import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRONEligibility } from "@/lib/tools/executionTools";

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

  let body: {
    signer_state?: string;
    document_type?: string;
    signer_location?: "in_state" | "out_of_state" | "international" | "unknown";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.signer_state) {
    return NextResponse.json(
      { error: "signer_state is required" },
      { status: 422 },
    );
  }

  const result = checkRONEligibility({
    signer_state: body.signer_state,
    document_type: body.document_type,
    signer_location: body.signer_location,
  });
  return NextResponse.json(result);
}
