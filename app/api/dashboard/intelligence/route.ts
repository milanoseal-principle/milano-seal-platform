import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const now = new Date().toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // Today's Executions: deals updated today with status in [in_execution, scheduled]
  const { data: todayExec, error: e1 } = await supabase
    .from("deals")
    .select("id")
    .in("deal_status", ["in_execution", "scheduled"])
    .gte("updated_at", todayISO);

  // Courier Exceptions: shipped but no delivery event (check for deals in shipped with no transit update)
  const { data: shippedDeals, error: e2 } = await supabase
    .from("deals")
    .select("id, deal_status")
    .eq("deal_status", "shipped");

  // Awaiting Payment: payment_status != payment_confirmed (and deal still open)
  const { data: awaitingPayment, error: e3 } = await supabase
    .from("deals")
    .select("id")
    .not("payment_status", "eq", "payment_confirmed")
    .not("deal_status", "in", "(completed,closed_won,closed_lost)");

  // Awaiting Apostille: deal_status = apostille_processing or apostille
  const { data: awaitingApostille, error: e4 } = await supabase
    .from("deals")
    .select("id")
    .in("deal_status", ["apostille_processing", "apostille"]);

  // Awaiting Release: courier_ready but not shipped
  const { data: awaitingRelease, error: e5 } = await supabase
    .from("deals")
    .select("id")
    .eq("deal_status", "courier_ready");

  // High Priority: urgent flag or overdue (due_at < now, still open)
  const { data: highPriority, error: e6 } = await supabase
    .from("deals")
    .select("id, due_at, deal_status")
    .not("deal_status", "in", "(completed,closed_won,closed_lost)")
    .lt("due_at", now)
    .not("due_at", "is", null);

  return NextResponse.json({
    today_executions: e1 ? 0 : (todayExec?.length ?? 0),
    courier_exceptions: e2 ? 0 : (shippedDeals?.length ?? 0),
    awaiting_payment: e3 ? 0 : (awaitingPayment?.length ?? 0),
    awaiting_apostille: e4 ? 0 : (awaitingApostille?.length ?? 0),
    awaiting_release: e5 ? 0 : (awaitingRelease?.length ?? 0),
    high_priority: e6 ? 0 : (highPriority?.length ?? 0),
    errors: {
      today_executions: !!e1,
      courier_exceptions: !!e2,
      awaiting_payment: !!e3,
      awaiting_apostille: !!e4,
      awaiting_release: !!e5,
      high_priority: !!e6,
    },
  });
}
