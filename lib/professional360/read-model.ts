import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCanonicalDeals, DealsSchemaError, type NormalizedDealRow } from "@/lib/deals/canonicalDealReadModel";
import { isOperationalTerminalState, resolveOperationalMatterState } from "@/lib/matter/canonicalOperationalRead";

export type EvidenceClass = "OBSERVED" | "ATTRIBUTED" | "MODELED" | "UNKNOWN";
export type ProfessionalRelationshipStatus = "ACTIVE" | "REPEAT" | "AT_RISK" | "PAUSED" | "LOST" | "DEVELOPING" | "UNKNOWN";

export interface Professional360MatterRef {
  id: string;
  displayId: string;
  status: string;
  destinationCountry: string | null;
  documentType: string | null;
  amountPaid: number | null;
  currency: string | null;
  completedAt: string | null;
}

export interface Professional360Account {
  organization: string;
  contacts: string[];
  relationshipOwner: string | null;
  countries: string[];
  matterTypes: string[];
  activeMatters: number;
  completedMatters: number;
  matterCount: number;
  verifiedRevenue: number | null;
  revenueCurrency: string | null;
  repeatRate: number | null;
  referralHistoryCount: number | null;
  lastMeaningfulTouch: string | null;
  relationshipStatus: ProfessionalRelationshipStatus;
  lossState: string | null;
  lossReason: string | null;
  nextMove: string;
  evidenceClass: EvidenceClass;
  evidence: string[];
  matters: Professional360MatterRef[];
}

export interface Professional360Snapshot {
  generatedAt: string;
  source: "canonical-deals";
  degraded: boolean;
  warning: string | null;
  accounts: Professional360Account[];
  totals: { accounts: number; active: number; repeat: number; atRisk: number; lost: number };
}

type RelationshipExtension = {
  id?: string | null;
  client_name?: string | null;
  loss_reason?: string | null;
  lost_stage?: string | null;
  lost_at?: string | null;
  repeat_client?: boolean | null;
  referred_by?: string | null;
};

type ActivityRow = { deal_id?: string | null; created_at?: string | null };
type ProfessionalRow = NormalizedDealRow & { extension?: RelationshipExtension; lastTouch?: string | null };

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean.length ? clean : null;
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())).map((v) => v.trim()))];
}

function resolvedState(row: NormalizedDealRow) {
  return resolveOperationalMatterState({ status: row.status }).state;
}

function stateLabel(row: NormalizedDealRow): string {
  return resolvedState(row) ?? text(row.status) ?? "unknown";
}

function isCompleted(row: NormalizedDealRow): boolean {
  return resolvedState(row) === "completed";
}

function verifiedPaidAmount(row: NormalizedDealRow): number | null {
  if (row.payment_confirmed !== true && row.payment_status !== "paid") return null;
  return row.verified_revenue ?? row.amount_paid ?? null;
}

function relationshipStatus(rows: ProfessionalRow[], completed: number, active: number): ProfessionalRelationshipStatus {
  if (rows.some((r) => Boolean(r.extension?.lost_at) || stateLabel(r) === "lost")) return "LOST";
  if (rows.some((r) => text(r.extension?.lost_stage)?.toLowerCase() === "paused")) return "PAUSED";
  if (completed >= 2 || rows.some((r) => r.extension?.repeat_client === true)) return "REPEAT";
  const latestTouchMs = rows
    .map((r) => r.lastTouch ?? r.created_at)
    .filter((v): v is string => Boolean(v))
    .map((v) => new Date(v).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  if (active > 0 && latestTouchMs && Date.now() - latestTouchMs > 45 * 86_400_000) return "AT_RISK";
  if (active > 0 || completed > 0) return "ACTIVE";
  if (rows.length > 0) return "DEVELOPING";
  return "UNKNOWN";
}

function nextMove(status: ProfessionalRelationshipStatus, active: number): string {
  if (status === "LOST") return "Review documented loss reason and recovery eligibility.";
  if (status === "PAUSED") return "Review pause evidence before any outreach.";
  if (status === "AT_RISK") return "Professional relationship update is due; review active Matter context first.";
  if (status === "REPEAT") return active > 0 ? "Send a professional Matter update tied to active work." : "Maintain the repeat relationship with a relevant corridor update.";
  if (status === "ACTIVE") return active > 0 ? "Use the active Matter as the next meaningful relationship touch." : "Review completed execution history before the next relationship touch.";
  return "Verify the professional relationship before assigning a commercial next action.";
}

function buildAccount(organization: string, rows: ProfessionalRow[], compCapability: "available" | "unavailable"): Professional360Account {
  const matters: Professional360MatterRef[] = rows.map((row) => ({
    id: row.id ?? row.deal_id ?? "unknown",
    displayId: row.deal_id ?? row.id ?? "Unknown Matter",
    status: stateLabel(row),
    destinationCountry: row.destination_country,
    documentType: row.document_type,
    amountPaid: verifiedPaidAmount(row),
    currency: row.currency,
    completedAt: row.completed_at,
  }));
  const completed = rows.filter(isCompleted).length;
  const active = rows.filter((r) => !isOperationalTerminalState(resolvedState(r))).length;
  const paidRows = rows.map((r) => ({ amount: verifiedPaidAmount(r), currency: text(r.currency) })).filter((r) => r.amount !== null);
  const currencies = unique(paidRows.map((r) => r.currency));
  const verifiedRevenue = paidRows.length && currencies.length <= 1 ? paidRows.reduce((sum, r) => sum + (r.amount ?? 0), 0) : null;
  const lastTouch = rows.map((r) => r.lastTouch ?? r.created_at).filter((v): v is string => Boolean(v)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
  const status = relationshipStatus(rows, completed, active);
  const lossRow = rows.find((r) => Boolean(r.extension?.loss_reason || r.extension?.lost_stage || r.extension?.lost_at));
  const referralEvidence = rows.filter((r) => text(r.extension?.referred_by)).length;

  return {
    organization,
    contacts: unique(rows.map((r) => text(r.extension?.client_name))),
    relationshipOwner: unique(rows.map((r) => text(r.assignee)))[0] ?? null,
    countries: unique(rows.map((r) => text(r.destination_country))),
    matterTypes: unique(rows.map((r) => text(r.document_type))),
    activeMatters: active,
    completedMatters: completed,
    matterCount: rows.length,
    verifiedRevenue,
    revenueCurrency: currencies.length === 1 ? currencies[0] : null,
    repeatRate: rows.length ? completed / rows.length : null,
    referralHistoryCount: referralEvidence > 0 ? referralEvidence : null,
    lastMeaningfulTouch: lastTouch,
    relationshipStatus: status,
    lossState: text(lossRow?.extension?.lost_stage),
    lossReason: text(lossRow?.extension?.loss_reason),
    nextMove: nextMove(status, active),
    evidenceClass: "OBSERVED",
    evidence: [
      `${rows.length} canonical Matter${rows.length === 1 ? "" : "s"}`,
      completed ? `${completed} completed Matter${completed === 1 ? "" : "s"}` : "No completed Matter evidence",
      paidRows.length ? `${paidRows.length} Matter${paidRows.length === 1 ? "" : "s"} with verified payment evidence` : "No verified paid Matter evidence",
      compCapability === "available" ? "Revenue capability available" : "Revenue capability limited to canonical base payment evidence",
    ],
    matters,
  };
}

export async function loadProfessional360(): Promise<Professional360Snapshot> {
  const generatedAt = new Date().toISOString();
  const supabase = createAdminClient();

  try {
    const canonical = await fetchCanonicalDeals(supabase, "2000-01-01T00:00:00.000Z");

    const extensions = new Map<string, RelationshipExtension>();
    const extensionQuery = await supabase.from("deals").select("id, client_name, loss_reason, lost_stage, lost_at, repeat_client, referred_by").limit(2000);
    if (!extensionQuery.error) {
      for (const extension of (extensionQuery.data ?? []) as RelationshipExtension[]) {
        if (extension.id) extensions.set(extension.id, extension);
      }
    }

    const lastTouches = new Map<string, string>();
    const activityQuery = await supabase.from("deal_activities").select("deal_id, created_at").order("created_at", { ascending: false }).limit(5000);
    if (!activityQuery.error) {
      for (const activity of (activityQuery.data ?? []) as ActivityRow[]) {
        if (activity.deal_id && activity.created_at && !lastTouches.has(activity.deal_id)) lastTouches.set(activity.deal_id, activity.created_at);
      }
    }

    const grouped = new Map<string, ProfessionalRow[]>();
    for (const row of canonical.rows) {
      const organization = text(row.company_name);
      if (!organization) continue;
      const id = row.id ?? row.deal_id ?? "";
      const enriched: ProfessionalRow = { ...row, extension: extensions.get(id), lastTouch: lastTouches.get(id) ?? null };
      grouped.set(organization, [...(grouped.get(organization) ?? []), enriched]);
    }

    const accounts = [...grouped.entries()]
      .map(([organization, rows]) => buildAccount(organization, rows, canonical.compCapability))
      .sort((a, b) => {
        const priority = { AT_RISK: 0, ACTIVE: 1, REPEAT: 2, DEVELOPING: 3, PAUSED: 4, LOST: 5, UNKNOWN: 6 } as const;
        return priority[a.relationshipStatus] - priority[b.relationshipStatus] || b.matterCount - a.matterCount;
      });

    return {
      generatedAt,
      source: "canonical-deals",
      degraded: false,
      warning: canonical.conflicts.length ? "Legacy canonical column conflicts exist; canonical precedence rules were applied." : null,
      accounts,
      totals: {
        accounts: accounts.length,
        active: accounts.filter((a) => a.relationshipStatus === "ACTIVE").length,
        repeat: accounts.filter((a) => a.relationshipStatus === "REPEAT").length,
        atRisk: accounts.filter((a) => a.relationshipStatus === "AT_RISK").length,
        lost: accounts.filter((a) => a.relationshipStatus === "LOST").length,
      },
    };
  } catch (error) {
    const warning = error instanceof DealsSchemaError
      ? "Canonical professional-account projection is unavailable; schema verification is required."
      : "Professional360 could not read canonical Matter evidence.";
    return { generatedAt, source: "canonical-deals", degraded: true, warning, accounts: [], totals: { accounts: 0, active: 0, repeat: 0, atRisk: 0, lost: 0 } };
  }
}

export function pickProfessionalDayAction(snapshot: Professional360Snapshot): Professional360Account | null {
  return snapshot.accounts.find((a) => a.relationshipStatus === "AT_RISK")
    ?? snapshot.accounts.find((a) => a.relationshipStatus === "REPEAT" && a.activeMatters > 0)
    ?? snapshot.accounts.find((a) => a.relationshipStatus === "ACTIVE")
    ?? null;
}
