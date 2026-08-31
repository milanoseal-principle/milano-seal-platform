import { NextResponse } from "next/server";
import { requireSeoControlApiAccess } from "@/lib/seo/activation/access";
import { syncSeoActivationActions } from "@/lib/seo/activation/repository";
import { getSeoRevenueFeedback } from "@/lib/seo/search-console/reporting";

export const runtime = "nodejs";

export async function POST() {
  const access = await requireSeoControlApiAccess();
  if (!access.ok) return access.response;
  try {
    const report = await getSeoRevenueFeedback();
    const snapshot = await syncSeoActivationActions(report.opportunities, access.userId);
    return NextResponse.json({
      synced: true,
      actionCount: snapshot.actions.length,
      derivedCandidateCount: snapshot.derivedCandidates.length,
      provisioned: snapshot.provisioned,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Activation sync failed." }, { status: 500 });
  }
}
