import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { loadMonitorTargets, runAuthorityMonitor } from "@/lib/intelligence/execution-brain/authorityMonitor";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const headerSecret = req.headers.get("x-cron-secret");
  const bearer = req.headers.get("authorization");
  return headerSecret === expected || bearer === `Bearer ${expected}`;
}

// Official-source monitor. Snapshots and review rows only; canonical authority
// records are never changed here.
async function handle(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const targets = await loadMonitorTargets(supabase);
  const result = await runAuthorityMonitor(supabase, targets);
  void audit({
    event: "cron.authority_monitor.completed",
    resource: "authority_source_snapshots",
    payload: { checked: result.checked, baselined: result.baselined, unchanged: result.unchanged, reviews_created: result.reviewsCreated, skipped: result.skipped.length },
  });
  return NextResponse.json({ success: true, ...result });
}

export const GET = handle;
export const POST = handle;
