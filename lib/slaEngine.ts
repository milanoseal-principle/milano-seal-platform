import { createAdminClient } from "@/lib/supabase/admin";

export interface SLABreach {
  deal_id: string;
  client_name: string;
  status: string;
  age_hours: number;
  breach_type: string;
  severity: "critical" | "warning";
}

const SLA_RULES = [
  // Payment not received within 48h of intake
  {
    breach_type: "Payment overdue 48h",
    hours: 48,
    status_check: (d: any) => d.payment_status === "unpaid",
    severity: "warning" as const,
  },
  // Payment not received within 7 days
  {
    breach_type: "Payment overdue 7 days — close or release",
    hours: 168,
    status_check: (d: any) => d.payment_status === "unpaid",
    severity: "critical" as const,
  },
  // Paid but not scheduled within 24h
  {
    breach_type: "Paid but not scheduled 24h",
    hours: 24,
    status_check: (d: any) =>
      d.payment_status === "paid" && d.status === "scheduled",
    severity: "critical" as const,
  },
  // In execution > 5 days without apostille
  {
    breach_type: "Execution stalled 5 days",
    hours: 120,
    status_check: (d: any) => d.status === "in_execution",
    severity: "critical" as const,
  },
  // Apostille submitted > 14 days without delivery
  {
    breach_type: "Apostille pending 14 days",
    hours: 336,
    status_check: (d: any) => d.status === "apostille",
    severity: "warning" as const,
  },
];

export async function checkSLA(): Promise<SLABreach[]> {
  const supabase = createAdminClient();
  const breaches: SLABreach[] = [];

  const { data: deals } = await supabase
    .from("deals")
    .select(
      "deal_id, client_name, status, payment_status, created_at, scheduled_at, execution_at"
    )
    .not("status", "in", '("completed","lost")');

  if (!deals?.length) return breaches;

  const now = Date.now();

  for (const deal of deals) {
    const ageHours = (now - new Date(deal.created_at).getTime()) / 3600000;

    for (const rule of SLA_RULES) {
      if (ageHours >= rule.hours && rule.status_check(deal)) {
        breaches.push({
          deal_id: deal.deal_id,
          client_name: deal.client_name,
          status: deal.status,
          age_hours: Math.round(ageHours),
          breach_type: rule.breach_type,
          severity: rule.severity,
        });
      }
    }
  }

  return breaches;
}

export async function getSLASummary() {
  const breaches = await checkSLA();
  return {
    total: breaches.length,
    critical: breaches.filter((b) => b.severity === "critical").length,
    warnings: breaches.filter((b) => b.severity === "warning").length,
    breaches,
  };
}
