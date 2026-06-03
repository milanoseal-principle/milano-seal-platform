export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("deals")
    .select("id, destination_country, matter_status, total_price, payment_status, created_at, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const COMPLETED = ["completed", "closed", "delivered"];
  const minus3d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const byCountry = new Map<string, {
    matter_count: number;
    open_count: number;
    revenue: number;
    blocked_count: number;
    completion_days: number[];
  }>();

  for (const row of rows) {
    const country = row.destination_country ?? "Unknown";
    if (!byCountry.has(country)) {
      byCountry.set(country, { matter_count: 0, open_count: 0, revenue: 0, blocked_count: 0, completion_days: [] });
    }
    const entry = byCountry.get(country)!;
    entry.matter_count++;
    const isCompleted = COMPLETED.includes(row.matter_status ?? "");
    if (!isCompleted) {
      entry.open_count++;
      if (row.updated_at < minus3d) {
        entry.blocked_count++;
      }
    }
    if (isCompleted && row.payment_status === "paid" && row.total_price) {
      entry.revenue += Number(row.total_price);
    }
    if (isCompleted && row.created_at && row.updated_at) {
      const days = Math.floor(
        (new Date(row.updated_at).getTime() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      entry.completion_days.push(days);
    }
  }

  const result = Array.from(byCountry.entries())
    .map(([country, stats]) => ({
      country,
      matter_count: stats.matter_count,
      open_count: stats.open_count,
      revenue: stats.revenue,
      blocked_count: stats.blocked_count,
      avg_completion_days:
        stats.completion_days.length > 0
          ? Math.round(stats.completion_days.reduce((a, b) => a + b, 0) / stats.completion_days.length)
          : null,
    }))
    .sort((a, b) => b.matter_count - a.matter_count);

  return NextResponse.json({ countries: result });
}
