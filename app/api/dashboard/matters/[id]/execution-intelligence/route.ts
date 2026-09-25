import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadMatterExecutionIntelligence } from "@/lib/intelligence/execution-brain/executionBrainServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Internal operator projection. GENERATE MATTER EXECUTION BRIEF returns the
// deterministic brief built from canonical facts only. Read-only.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireDashboardAccess();
  const { id } = await params;
  const loaded = await loadMatterExecutionIntelligence(id);
  if (!loaded) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  if (req.nextUrl.searchParams.get("brief") === "1") {
    return NextResponse.json({ brief: loaded.brief, status: loaded.intelligence.status, generatedAt: loaded.intelligence.generatedAt });
  }
  return NextResponse.json({ intelligence: loaded.intelligence });
}
