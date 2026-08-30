import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import {
  reconcileAuthorityFreshness,
  type ReceivingAuthorityRow,
} from "@/lib/authorities/reconcileFreshness";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const headerSecret = req.headers.get("x-cron-secret");
  const bearer = req.headers.get("authorization");

  return headerSecret === expected || bearer === `Bearer ${expected}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("receiving_authorities")
    .select(
      "id,country,authority_name,source_url,last_verified_at,stale_after_days,confidence_level,manual_review_required,routing_status",
    );

  if (error) {
    void audit({
      event: "cron.authority_freshness.failed",
      resource: "receiving_authorities",
      payload: { code: error.code ?? "query_failed" },
    });
    return NextResponse.json({ error: "Authority scan failed" }, { status: 500 });
  }

  const now = new Date();
  const summary = {
    scanned: 0,
    active: 0,
    review_required: 0,
    review_due_soon: 0,
    stale: 0,
    changed: 0,
    errors: [] as { id: string; code: string }[],
  };

  for (const raw of data ?? []) {
    const row = raw as ReceivingAuthorityRow;
    summary.scanned++;

    const decision = reconcileAuthorityFreshness(row, now);
    if (decision.desiredRoutingStatus === "ACTIVE") summary.active++;
    else summary.review_required++;
    if (decision.reviewDueSoon) summary.review_due_soon++;
    if (decision.stale) summary.stale++;

    const needsUpdate =
      row.routing_status !== decision.desiredRoutingStatus ||
      row.manual_review_required !== decision.manualReviewRequired;

    if (!needsUpdate) continue;

    const { error: updateError } = await supabase
      .from("receiving_authorities")
      .update({
        routing_status: decision.desiredRoutingStatus,
        manual_review_required: decision.manualReviewRequired,
      })
      .eq("id", row.id);

    if (updateError) {
      summary.errors.push({ id: row.id, code: updateError.code ?? "update_failed" });
      continue;
    }

    summary.changed++;
  }

  void audit({
    event: "cron.authority_freshness",
    resource: "receiving_authorities",
    payload: summary,
  });

  return NextResponse.json(summary);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
