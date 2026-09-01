import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
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
  totals: {
    accounts: number;
    active: number;
    repeat: number;
    atRisk: number;
    lost: number;
  };
}

type DealRow = {
  id?: string | null;
  deal_id?: string | null;
  client_name?: string | null;
  company_name?: string | null;
  status?: string | null;
  deal_status?: string | null;
  payment_status?: string | null;
  payment_confirmed?: boolean | null;
  amount_paid?: number | string | null;
  verified_revenue?: number | string | null;
  currency?: string | null;
  destination_country?: string | null;
  country?: string | null;
  document_type?: string | null;
  document?: string | null;
  assignee?: string | null;
  relationship_tier?: string | null;
  referred_by?: string | null;
  repeat_client?: boolean | null;
  loss_reason?: string | null;
  lost_stage?: string | null;
  lost_at?: string | null;
  last_activity?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
};

const COLUMNS = [
  "id",
  "deal_id",
  "client_name",
  "company_name",
  "status",
  "deal_status",
  "payment_status",
  "payment_confirmed",
  "amount_paid",
  "verified_revenue",
  "currency",
  "destination_country",
  "country",
  "document_type",
  "document",
  "assignee",
  "relationship_tier",
  "referred_by",
  "repeat_client",
  "loss_reason",
  "lost_stage",
  "lost_at",
  "last_activity",
  "created_at",
  "updated_at",
  "completed_at",
].join(", ");

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean.length ? clean : null;
}

function amount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())).map((v) => v.trim()))];
}

function state(row: DealRow): string {
  const resolved = resolveOperationalMatterState(row);
  return resolved.state ?? resolved.rawState ?? "unknown";
}

function isCompleted(row: DealRow): boolean {
  return isOperationalTerminalState(state(row)) && state(row) === "completed";
}

function verifiedPaidAmount(row: DealRow): number | null {
  if (row.payment_confirmed !== true && row.payment_status !== "paid") return null;
  return amount(row.verified_revenue) ?? amount(row.amount_paid);
}

function relationshipStatus(rows: DealRow[], completed: number, active: number): ProfessionalRelationshipStatus {
  if (rows.some((r) => Boolean(r.lost_at) || state(r) === "lost")) return "LOST";
  if (rows.some((r) => text(r.lost_stage)?.toLowerCase() === "paused")) return "PAUSED";
  if (completed >= 2 || rows.some((r) => r.repeat_client === true)) return "REPEAT";
  const latestActivity = rows
    .map((r) => text(r.last_activity) ?? text(r.updated_at) ?? text(r.created_at))
    .filter((v): v is string => Boolean(v))
    .map((v) => new Date(v).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  if (active > 0 && latestActivity && Date.now() - latestActivity > 45 * 86_400_000) return "AT_RISK";
  if (active > 0 || completed > 0) return "ACTIVE";
  if (rows.length > 0) return "DEVELOPING";
  return "UNKNOWN";
}

function nextMove(status: ProfessionalRelationshipStatus, account: { active: number; lastTouch: string | null }): string {
  if (status === "LOST") return "Review documented loss reason and recovery eligibility.";
  if (status === "PAUSED") return "Review pause evidence before any outreach.";
  if (status === "AT_RISK") return "Professional relationship update is due; review active Matter context first.";
  if (status === "REPEAT") return account.active > 0 ? "Send a professional Matter update tied to the active work." : "Maintain the repeat relationship with a relevant corridor update.";
  if (status === "ACTIVE") return account.active > 0 ? "Use the active Matter as the next meaningful relationship touch." : "Review completed execution history before the next relationship touch.";
  return "Verify the professional relationship before assigning a commercial next action.";
}

function buildAccount(organization: string, rows: DealRow[]): Professional360Account {
  const matters = rows.map((row) => ({
    id: text(row.id) ?? text(row.deal_id) ?? "unknown",
    displayId: text(row.deal_id) ?? text(row.id) ?? "Unknown Matter",
    status: state(row),
    destinationCountry: text(row.destination_country) ?? text(row.country),
    documentType: text(row.document_type) ?? text(row.document),
    amountPaid: verifiedPaidAmount(row),
    currency: text(row.currency),
    completedAt: text(row.completed_at),
  }));
  const completed = rows.filter(isCompleted).length;
  const active = rows.length - rows.filter((r) => isOperationalTerminalState(state(r))).length;
  const paidRows = rows.map((r) => ({ amount: verifiedPaidAmount(r), currency: text(r.currency) })).filter((r) => r.amount !== null);
  const currencies = unique(paidRows.map((r) => r.currency));
  const verifiedRevenue = paidRows.length && currencies.length <= 1 ? paidRows.reduce((sum, r) => sum + (r.amount ?? 0), 0) : null;
  const lastTouch = rows
    .map((r) => text(r.last_activity) ?? text(r.updated_at) ?? text(r.created_at))
    .filter((v): v is string => Boolean(v))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
  const status = relationshipStatus(rows, completed, active);
  const lossRow = rows.find((r) => Boolean(r.loss_reason || r.lost_stage || r.lost_at));
  const referralEvidence = rows.filter((r) => text(r.referred_by)).length;

  return {
    organization,
    contacts: unique(rows.map((r) => text(r.client_name))),
    relationshipOwner: unique(rows.map((r) => text(r.assignee)))[0] ?? null,
    countries: unique(rows.map((r) => text(r.destination_country) ?? text(r.country))),
    matterTypes: unique(rows.map((r) => text(r.document_type) ?? text(r.document))),
    activeMatters: active,
    completedMatters: completed,
    matterCount: rows.length,
    verifiedRevenue,
    revenueCurrency: currencies.length === 1 ? currencies[0] : null,
    repeatRate: rows.length ? completed / rows.length : null,
    referralHistoryCount: referralEvidence > 0 ? referralEvidence : null,
    lastMeaningfulTouch: lastTouch,
    relationshipStatus: status,
    lossState: text(lossRow?.lost_stage),
    lossReason: text(lossRow?.loss_reason),
    nextMove: nextMove(status, { active, lastTouch }),
    evidenceClass: "OBSERVED",
    evidence: [
      `${rows.length} canonical Matter${rows.length === 1 ? "" : "s"}`,
      completed ? `${completed} completed Matter${completed === 1 ? "" : "s"}` : "No completed Matter evidence",
      paidRows.length ? `${paidRows.length} Matter${paidRows.length === 1 ? "" : "s"} with verified payment evidence` : "No verified paid Matter evidence",
    ],
    matters,
  };
}

export async function loadProfessional360(): Promise<Professional360Snapshot> {
  const generatedAt = new Date().toISOString();
  const supabase = createAdminClient();
  const query = await supabase.from("deals").select(COLUMNS).order("updated_at", { ascending: false }).limit(2000);

  if (query.error) {
    return {
      generatedAt,
      source: "canonical-deals",
      degraded: true,
      warning: "Canonical professional-account projection is unavailable; no relationship all-clear may be inferred.",
      accounts: [],
      totals: { accounts: 0, active: 0, repeat: 0, atRisk: 0, lost: 0 },
    };
  }

  const grouped = new Map<string, DealRow[]>();
  for (const row of (query.data ?? []) as DealRow[]) {
    const organization = text(row.company_name);
    if (!organization) continue;
    grouped.set(organization, [...(grouped.get(organization) ?? []), row]);
  }

  const accounts = [...grouped.entries()]
    .map(([organization, rows]) => buildAccount(organization, rows))
    .sort((a, b) => {
      const priority = { AT_RISK: 0, ACTIVE: 1, REPEAT: 2, DEVELOPING: 3, PAUSED: 4, LOST: 5, UNKNOWN: 6 } as const;
      return priority[a.relationshipStatus] - priority[b.relationshipStatus] || b.matterCount - a.matterCount;
    });

  return {
    generatedAt,
    source: "canonical-deals",
    degraded: false,
    warning: null,
    accounts,
    totals: {
      accounts: accounts.length,
      active: accounts.filter((a) => a.relationshipStatus === "ACTIVE").length,
      repeat: accounts.filter((a) => a.relationshipStatus === "REPEAT").length,
      atRisk: accounts.filter((a) => a.relationshipStatus === "AT_RISK").length,
      lost: accounts.filter((a) => a.relationshipStatus === "LOST").length,
    },
  };
}

export function pickProfessionalDayAction(snapshot: Professional360Snapshot): Professional360Account | null {
  return snapshot.accounts.find((a) => a.relationshipStatus === "AT_RISK")
    ?? snapshot.accounts.find((a) => a.relationshipStatus === "REPEAT" && a.activeMatters > 0)
    ?? snapshot.accounts.find((a) => a.relationshipStatus === "ACTIVE")
    ?? null;
}
