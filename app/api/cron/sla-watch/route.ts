import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAutomation } from "@/lib/automation";
import { checkSLA } from "@/lib/slaMonitor";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.get("x-cron-secret");
    if (got !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .not("status", "in", "(completed,lost)");

  const summary = {
    scanned: 0,
    sla_high: 0,
    sla_medium: 0,
    sla_low: 0,
    automations_dispatched: 0,
    errors: [] as { deal_id: string; error: string }[],
  };

  for (const d of deals ?? []) {
    summary.scanned++;
    try {
      const verdict = checkSLA(d);
      if (!verdict.ok) {
        if (verdict.severity === "high") summary.sla_high++;
        else if (verdict.severity === "medium") summary.sla_medium++;
        else summary.sla_low++;
      }

      await runAutomation(d);
      summary.automations_dispatched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      summary.errors.push({
        deal_id: d.id ?? d.deal_id ?? "unknown",
        error: msg,
      });
    }
  }

  void audit({
    event: "cron.sla_watch",
    resource: "system",
    payload: summary,
  });

  return NextResponse.json(summary);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
