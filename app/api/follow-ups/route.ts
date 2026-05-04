import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface FollowUpRow {
  id: string;
  deal_id: string;
  type: "24h" | "72h" | "7d";
  due_at: string;
  status: "pending" | "completed" | "cancelled";
  note: string | null;
  created_at: string;
}

const STEP_HOURS: Record<"24h" | "72h" | "7d", number> = {
  "24h": 24,
  "72h": 72,
  "7d": 168,
};

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deals")
    .select(
      "deal_id, created_at, status, payment_status, followup_24h, followup_72h, followup_7d, follow_up_active"
    )
    .eq("payment_status", "pending")
    .not("status", "in", '("completed","lost")')
    .limit(500);

  if (error) {
    console.error("[follow-ups] read failed:", error.message);
    return NextResponse.json([]);
  }

  const rows: FollowUpRow[] = [];
  for (const d of data ?? []) {
    if (!d.deal_id) continue;
    const created = new Date(d.created_at).getTime();
    for (const step of ["24h", "72h", "7d"] as const) {
      const due = new Date(created + STEP_HOURS[step] * 3600_000);
      const flagKey =
        step === "24h"
          ? "followup_24h"
          : step === "72h"
          ? "followup_72h"
          : "followup_7d";
      const done = Boolean((d as Record<string, unknown>)[flagKey]);
      const status: FollowUpRow["status"] = done ? "completed" : "pending";

      if (status === "pending" && due.getTime() > Date.now() + 24 * 3600_000)
        continue;

      rows.push({
        id: `${d.deal_id}:${step}`,
        deal_id: d.deal_id,
        type: step,
        due_at: due.toISOString(),
        status,
        note: null,
        created_at: d.created_at,
      });
    }
  }

  rows.sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  return NextResponse.json(rows);
}
