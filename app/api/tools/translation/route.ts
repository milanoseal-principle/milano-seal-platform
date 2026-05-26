import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectTranslation } from "@/lib/tools/executionTools";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["admin", "ops_manager"]);

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
    (user.user_metadata?.role as string) ??
    (user.app_metadata?.role as string) ??
    "";

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { destination_country?: string; document_language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.destination_country) {
    return NextResponse.json(
      { error: "destination_country is required" },
      { status: 422 },
    );
  }

  const result = detectTranslation({
    destination_country: body.destination_country,
    document_language: body.document_language,
  });
  return NextResponse.json(result);
}
