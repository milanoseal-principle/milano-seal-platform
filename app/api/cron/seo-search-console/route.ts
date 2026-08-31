import { NextRequest, NextResponse } from "next/server";
import { searchConsoleConfigured } from "@/lib/seo/search-console/client";
import { syncSearchConsole } from "@/lib/seo/search-console/sync";
import { getSeoRevenueFeedback } from "@/lib/seo/search-console/reporting";
import { getSeoAuthorityActivationSnapshot, syncSeoActivationActions } from "@/lib/seo/activation/repository";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!searchConsoleConfigured()) return NextResponse.json({ error: "SEARCH_CONSOLE_UNCONFIGURED" }, { status: 503 });

  const now = Date.now();
  const endDate = new Date(now - 3 * 86400000).toISOString().slice(0, 10);
  const startDate = new Date(now - 30 * 86400000).toISOString().slice(0, 10);
  try {
    const result = await syncSearchConsole(startDate, endDate, { triggerType: "CRON" });

    // Downstream only: activation prioritization can never block verified Search Console ingestion.
    let activation: Record<string, unknown> = { status: "SKIPPED" };
    try {
      const report = await getSeoRevenueFeedback();
      const current = await getSeoAuthorityActivationSnapshot(report.opportunities);
      if (!current.provisioned) {
        activation = { status: "NOT_PROVISIONED", message: current.provisioningMessage };
      } else {
        const refreshed = await syncSeoActivationActions(report.opportunities, null);
        activation = {
          status: "SYNCED",
          openActions: refreshed.actions.length,
          derivedCandidates: refreshed.derivedCandidates.length,
        };
      }
    } catch (activationError) {
      console.warn("[seo-search-console cron] activation refresh degraded", activationError instanceof Error ? activationError.message : activationError);
      activation = { status: "DEGRADED" };
    }

    return NextResponse.json({ success: true, startDate, endDate, ...result, activation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEARCH_CONSOLE_SYNC_FAILED";
    return NextResponse.json({ success: false, error: message.slice(0, 500), startDate, endDate }, { status: 500 });
  }
}
