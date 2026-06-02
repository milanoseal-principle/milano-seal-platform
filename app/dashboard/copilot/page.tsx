export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { OperatorCopilot } from "@/components/dashboard/OperatorCopilot";

export const metadata = {
  title: "Operator Copilot — Milano Seal",
};

export interface CopilotAction {
  priority: "critical" | "high" | "medium" | "low";
  category: "execution" | "revenue" | "authority" | "relationship" | "trust" | "system";
  title: string;
  description: string;
  count?: number;
  value?: number;
  actionLabel: string;
  actionRoute: string;
}

export interface IntelligenceSignals {
  topCountry: string | null;
  avgPaidDealValue: number;
  avgDaysToComplete: number;
  openPipelineCount: number;
}

export interface CopilotBriefing {
  actions: CopilotAction[];
  signals: IntelligenceSignals;
  generatedAt: string;
}

interface StaleMatter {
  id: string;
  client_name: string | null;
  matter_status: string | null;
  destination_country: string | null;
  updated_at: string | null;
  total_price: number | null;
}

interface ReleaseReadyMatter {
  id: string;
  client_name: string | null;
  destination_country: string | null;
  matter_status: string | null;
  total_price: number | null;
}

interface HighValueLead {
  id: string;
  client_name: string | null;
  total_price: number | null;
  conversion_score: number | null;
  destination_country: string | null;
  created_at: string | null;
}

interface FollowUp {
  id: string;
  deal_id: string | null;
  type: string | null;
  due_at: string | null;
  note: string | null;
}

interface RecentCompleted {
  id: string;
  client_name: string | null;
  destination_country: string | null;
  completed_at: string | null;
}

interface MissingApostille {
  id: string;
  client_name: string | null;
  destination_country: string | null;
  matter_status: string | null;
  scheduled_at: string | null;
}

interface DealRow {
  id: string;
  destination_country: string | null;
  total_price: number | null;
  payment_status: string | null;
  completed_at: string | null;
  created_at: string | null;
  matter_status: string | null;
}

const PRIORITY_ORDER: Record<CopilotAction["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CATEGORY_ORDER: Record<CopilotAction["category"], number> = {
  execution: 0,
  revenue: 1,
  authority: 2,
  relationship: 3,
  trust: 4,
  system: 5,
};

function generateCopilotBriefing(data: {
  staleMatters: StaleMatter[];
  releasesReady: ReleaseReadyMatter[];
  highValueLeads: HighValueLead[];
  followUps: FollowUp[];
  recentCompleted: RecentCompleted[];
  missingApostille: MissingApostille[];
  allDeals: DealRow[];
}): CopilotBriefing {
  const actions: CopilotAction[] = [];
  const { staleMatters, releasesReady, highValueLeads, followUps, recentCompleted, missingApostille, allDeals } = data;

  if (staleMatters.length > 0) {
    actions.push({
      priority: "critical",
      category: "execution",
      title: `${staleMatters.length} matter${staleMatters.length > 1 ? "s" : ""} stale for 7+ days`,
      description:
        "These matters have had no status update in over a week. Each day of delay risks client attrition and delivery failure.",
      count: staleMatters.length,
      actionLabel: "Review in Execution Control",
      actionRoute: "/dashboard/execution-control",
    });
  }

  if (releasesReady.length > 0) {
    actions.push({
      priority: "critical",
      category: "execution",
      title: `${releasesReady.length} matter${releasesReady.length > 1 ? "s" : ""} ready for release`,
      description: "Apostille complete. Awaiting operator release authorization. Client is waiting.",
      count: releasesReady.length,
      actionLabel: "Process Releases",
      actionRoute: "/dashboard/releases",
    });
  }

  if (missingApostille.length > 0) {
    actions.push({
      priority: "high",
      category: "execution",
      title: `${missingApostille.length} matter${missingApostille.length > 1 ? "s" : ""} pending apostille submission`,
      description: "Paid matters with apostille required but no submission date recorded.",
      count: missingApostille.length,
      actionLabel: "Review Apostille Queue",
      actionRoute: "/dashboard/apostille",
    });
  }

  if (followUps.length > 0) {
    actions.push({
      priority: "high",
      category: "revenue",
      title: `${followUps.length} follow-up${followUps.length > 1 ? "s" : ""} past due`,
      description:
        "Scheduled touchpoints that have not been completed. Each missed follow-up is a missed conversion or retention opportunity.",
      count: followUps.length,
      actionLabel: "Clear Follow-ups",
      actionRoute: "/dashboard/follow-ups",
    });
  }

  if (highValueLeads.length > 0) {
    const totalValue = highValueLeads.reduce((s, d) => s + (d.total_price ?? 0), 0);
    actions.push({
      priority: "high",
      category: "revenue",
      title: `${highValueLeads.length} high-probability lead${highValueLeads.length > 1 ? "s" : ""} unpaid`,
      description: `Conversion score ≥70. Combined value: $${totalValue.toLocaleString()}. These are the highest-value conversion opportunities right now.`,
      count: highValueLeads.length,
      value: totalValue,
      actionLabel: "View High-Value Pipeline",
      actionRoute: "/dashboard/leads",
    });
  }

  if (recentCompleted.length > 0) {
    actions.push({
      priority: "medium",
      category: "trust",
      title: `${recentCompleted.length} completed matter${recentCompleted.length > 1 ? "s" : ""} eligible for review request`,
      description:
        "Recent completions without a Google or testimonial review request sent. Every review builds the public trust layer.",
      count: recentCompleted.length,
      actionLabel: "Queue Review Requests",
      actionRoute: "/dashboard/reviews",
    });
  }

  actions.push({
    priority: "medium",
    category: "authority",
    title: "Authority verification backlog",
    description:
      "The authority moat grows one verification at a time. Target: 5 new OBSERVED → PARTNER_CONFIRMED promotions this week.",
    actionLabel: "Open Authority Workbench",
    actionRoute: "/dashboard/authorities/verify",
  });

  actions.push({
    priority: "low",
    category: "system",
    title: "Deployment checklist status",
    description: "Confirm all infrastructure items are verified in production.",
    actionLabel: "View Deployment Status",
    actionRoute: "/dashboard/deployment",
  });

  actions.sort((a, b) => {
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pd !== 0) return pd;
    return CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
  });

  // Intelligence signals
  const openDeals = allDeals.filter(
    (d) =>
      d.payment_status === "paid" &&
      d.matter_status !== "completed" &&
      d.matter_status !== "released" &&
      d.matter_status !== "cancelled"
  );

  const countryValues: Record<string, number> = {};
  for (const d of openDeals) {
    if (d.destination_country) {
      countryValues[d.destination_country] = (countryValues[d.destination_country] ?? 0) + (d.total_price ?? 0);
    }
  }
  const topCountry =
    Object.keys(countryValues).sort((a, b) => countryValues[b] - countryValues[a])[0] ?? null;

  const paidDeals = allDeals.filter((d) => d.payment_status === "paid");
  const avgPaidDealValue =
    paidDeals.length > 0
      ? paidDeals.reduce((s, d) => s + (d.total_price ?? 0), 0) / paidDeals.length
      : 0;

  const completedWithDates = paidDeals.filter((d) => d.completed_at && d.created_at);
  const avgDaysToComplete =
    completedWithDates.length > 0
      ? completedWithDates.reduce((s, d) => {
          const diff =
            new Date(d.completed_at!).getTime() - new Date(d.created_at!).getTime();
          return s + diff / (1000 * 60 * 60 * 24);
        }, 0) / completedWithDates.length
      : 0;

  return {
    actions,
    signals: {
      topCountry,
      avgPaidDealValue: Math.round(avgPaidDealValue),
      avgDaysToComplete: Math.round(avgDaysToComplete),
      openPipelineCount: openDeals.length,
    },
    generatedAt: new Date().toISOString(),
  };
}

export default async function CopilotPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  let staleMatters: StaleMatter[] = [];
  let releasesReady: ReleaseReadyMatter[] = [];
  let highValueLeads: HighValueLead[] = [];
  let followUps: FollowUp[] = [];
  let recentCompleted: RecentCompleted[] = [];
  let missingApostille: MissingApostille[] = [];
  let allDeals: DealRow[] = [];

  try {
    const { data } = await supabase
      .from("deals")
      .select("id, client_name, matter_status, destination_country, updated_at, total_price")
      .eq("payment_status", "paid")
      .lt("updated_at", sevenDaysAgo)
      .not("matter_status", "in", '("completed","released","cancelled")');
    staleMatters = data ?? [];
  } catch {}

  try {
    const { data } = await supabase
      .from("deals")
      .select("id, client_name, destination_country, matter_status, total_price")
      .in("matter_status", ["apostille_complete", "ready_for_release"]);
    releasesReady = data ?? [];
  } catch {}

  try {
    const { data } = await supabase
      .from("deals")
      .select("id, client_name, total_price, conversion_score, destination_country, created_at")
      .eq("payment_status", "unpaid")
      .gte("conversion_score", 70)
      .neq("matter_status", "cancelled")
      .order("total_price", { ascending: false })
      .limit(5);
    highValueLeads = data ?? [];
  } catch {}

  try {
    const { data } = await supabase
      .from("follow_ups")
      .select("id, deal_id, type, due_at, note")
      .eq("status", "pending")
      .lte("due_at", new Date().toISOString())
      .limit(10);
    followUps = data ?? [];
  } catch {}

  try {
    const { data } = await supabase
      .from("deals")
      .select("id, client_name, destination_country, completed_at")
      .in("matter_status", ["completed", "released"])
      .gte("completed_at", fourteenDaysAgo);
    recentCompleted = data ?? [];
  } catch {}

  try {
    const { data } = await supabase
      .from("deals")
      .select("id, client_name, destination_country, matter_status, scheduled_at")
      .eq("payment_status", "paid")
      .eq("apostille_required", true)
      .is("apostille_at", null)
      .not("matter_status", "in", '("completed","released","cancelled")');
    missingApostille = data ?? [];
  } catch {}

  try {
    const { data } = await supabase
      .from("deals")
      .select("id, destination_country, total_price, payment_status, completed_at, created_at, matter_status");
    allDeals = data ?? [];
  } catch {}

  const briefing = generateCopilotBriefing({
    staleMatters,
    releasesReady,
    highValueLeads,
    followUps,
    recentCompleted,
    missingApostille,
    allDeals,
  });

  return <OperatorCopilot briefing={briefing} />;
}
