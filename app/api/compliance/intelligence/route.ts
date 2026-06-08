import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = [
  "new", "intake_received", "under_review", "compliance_review", "quoted",
  "awaiting_payment", "payment_confirmed", "scheduled", "in_execution",
  "apostille_processing", "courier_ready",
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";
  if (!["founder_admin", "admin_operator"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createAdminClient();

  const { data } = await db
    .from("deals")
    .select("id, deal_id, client_name, document_type, destination_country, deal_status, apostille_required, translation, multi_country")
    .in("deal_status", ACTIVE_STATUSES)
    .or("apostille_required.eq.true,translation.eq.true,multi_country.eq.true")
    .order("created_at", { ascending: false })
    .limit(50);

  type Severity = "high" | "medium" | "low";
  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

  const alerts = (data ?? [])
    .map(d => {
      const flags: string[] = [];
      if (d.apostille_required) flags.push("apostille");
      if (d.translation) flags.push("translation");
      if (d.multi_country) flags.push("multi_country");

      let severity: Severity = "low";
      if (flags.length >= 2 || d.multi_country) severity = "high";
      else if (flags.includes("apostille")) severity = "medium";

      return {
        id: d.id,
        deal_id: d.deal_id,
        client_name: d.client_name,
        document_type: d.document_type,
        destination_country: d.destination_country,
        deal_status: d.deal_status,
        flags,
        severity,
      };
    })
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return NextResponse.json({ alerts, total: alerts.length });
}
