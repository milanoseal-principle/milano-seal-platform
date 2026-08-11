import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { buildDynamicSessionPlaybookFromMatterRecord } from "@/lib/pre-execution/dynamicSessionPlaybook";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matterId: string }> },
) {
  await requireDashboardAccess();
  const { matterId } = await params;
  const adminClient = createAdminClient();

  try {
    const { data: matter, error } = await adminClient
      .from("deals")
      .select("*")
      .eq("id", matterId)
      .single();

    if (error || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const playbook = buildDynamicSessionPlaybookFromMatterRecord(
      matter as Record<string, unknown>,
    );

    return NextResponse.json({
      matter_id: matterId,
      playbook,
      source: "canonical_matter_record",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate session playbook" },
      { status: 500 },
    );
  }
}
