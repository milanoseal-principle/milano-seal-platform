import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SLA_HOURS, isOpenStage } from "@/lib/stateMachine";
import { serializeDealMS } from "@/lib/milanoSerialize";
import { requireOperator, isGuardFailure } from "@/lib/auth-guards";

export const runtime = "nodejs";

interface Alert {
  deal_id: string;
  client_name: string;
  deal_status: string;
  hours_in_stage: number;
  sla_hours: number;
  severity: "low" | "medium" | "high";
}

export async function GET() {
  const guard = await requireOperator();
  if (isGuardFailure(guard)) return guard.response;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });

  const deals = (data ?? []).map(serializeDealMS);
  const now = Date.now();
  const alerts: Alert[] = [];

  for (const d of deals) {
    if (!isOpenStage(d.deal_status)) continue;
    const sla = SLA_HOURS[d.deal_status];
    if (!sla) continue;

    const ageHours = (now - new Date(d.created_at).getTime()) / 3_600_000;

    if (ageHours <= sla) continue;

    const ratio = ageHours / sla;
    const severity: Alert["severity"] =
      ratio >= 2 ? "high" : ratio >= 1.5 ? "medium" : "low";

    alerts.push({
      deal_id: d.deal_id ?? "",
      client_name: d.client_name ?? "",
      deal_status: d.deal_status,
      hours_in_stage: Math.round(ageHours),
      sla_hours: sla,
      severity,
    });
  }

  alerts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    return order[a.severity] - order[b.severity];
  });

  return NextResponse.json(alerts);
}
