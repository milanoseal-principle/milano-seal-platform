import { createAdminClient } from "@/lib/supabase/admin";
import {
  operationalClientName,
  operationalMatterDisplayId,
  resolveOperationalMatterState,
  stateLabel,
  type OperationalMatterSourceRow,
} from "@/lib/matter/canonicalOperationalRead";

export type OperationalLedgerSource =
  | "matter_events"
  | "deal_events"
  | "custody_ledger";

export interface OperationalLedgerEntry {
  id: string;
  source: OperationalLedgerSource;
  matterUuid: string;
  matterId: string;
  clientName: string;
  eventName: string;
  description: string | null;
  actor: string | null;
  currentState: string;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
  matterHref: string;
}

export interface OperationalLedgerSnapshot {
  generatedAt: string;
  matterFilter: string | null;
  entries: OperationalLedgerEntry[];
  sourceErrors: string[];
  degraded: boolean;
}

interface MatterEventRow {
  id: string;
  matter_id: string;
  event_type: string;
  notes: string | null;
  actor: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface DealEventRow {
  id: string;
  deal_id: string;
  event: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

interface CustodyEventRow {
  id: string;
  deal_id: string;
  event: string;
  actor_type: string | null;
  actor_id: string | null;
  location: string | null;
  method: string | null;
  status: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface MatterIdentityRow extends OperationalMatterSourceRow {
  id: string;
}

function compactJson(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function payloadDescription(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  for (const key of ["description", "detail", "message", "reason", "status"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return compactJson(payload);
}

export async function loadOperationalLedger(options: {
  matterId?: string | null;
  limit?: number;
} = {}): Promise<OperationalLedgerSnapshot> {
  const supabase = createAdminClient();
  const limit = Math.min(Math.max(options.limit ?? 250, 1), 500);
  const matterFilter = options.matterId?.trim() || null;

  let matterQuery = supabase
    .from("matter_events")
    .select("id, matter_id, event_type, notes, actor, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  let dealQuery = supabase
    .from("deal_events")
    .select("id, deal_id, event, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  let custodyQuery = supabase
    .from("custody_ledger")
    .select(
      "id, deal_id, event, actor_type, actor_id, location, method, status, notes, metadata, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (matterFilter) {
    matterQuery = matterQuery.eq("matter_id", matterFilter);
    dealQuery = dealQuery.eq("deal_id", matterFilter);
    custodyQuery = custodyQuery.eq("deal_id", matterFilter);
  }

  const [matterResult, dealResult, custodyResult] = await Promise.all([
    matterQuery,
    dealQuery,
    custodyQuery,
  ]);

  const sourceErrors: string[] = [];
  if (matterResult.error) sourceErrors.push(`matter_events: ${matterResult.error.message}`);
  if (dealResult.error) sourceErrors.push(`deal_events: ${dealResult.error.message}`);
  if (custodyResult.error) sourceErrors.push(`custody_ledger: ${custodyResult.error.message}`);

  if (sourceErrors.length === 3) {
    throw new Error(`Operational ledger unavailable: ${sourceErrors.join(" | ")}`);
  }

  const matterEvents = (matterResult.data ?? []) as MatterEventRow[];
  const dealEvents = (dealResult.data ?? []) as DealEventRow[];
  const custodyEvents = (custodyResult.data ?? []) as CustodyEventRow[];

  const matterIds = [
    ...new Set([
      ...matterEvents.map((row) => row.matter_id),
      ...dealEvents.map((row) => row.deal_id),
      ...custodyEvents.map((row) => row.deal_id),
    ].filter(Boolean)),
  ];

  const identityById = new Map<string, MatterIdentityRow>();

  if (matterIds.length) {
    const { data, error } = await supabase
      .from("deals")
      .select(
        "id, deal_id, client_name, full_name, status, deal_status, destination_country, country, document_type, document, service_type",
      )
      .in("id", matterIds);

    if (error) {
      sourceErrors.push(`deals identity: ${error.message}`);
    } else {
      for (const row of (data ?? []) as MatterIdentityRow[]) {
        identityById.set(row.id, row);
      }
    }
  }

  const identity = (matterUuid: string) => {
    const row = identityById.get(matterUuid) ?? ({ id: matterUuid } as MatterIdentityRow);
    const state = resolveOperationalMatterState(row).state;
    return {
      matterId: operationalMatterDisplayId(row),
      clientName: operationalClientName(row),
      currentState: stateLabel(state),
      matterHref: `/dashboard/deals/${encodeURIComponent(matterUuid)}`,
    };
  };

  const entries: OperationalLedgerEntry[] = [];

  for (const row of matterEvents) {
    const id = identity(row.matter_id);
    entries.push({
      id: `matter:${row.id}`,
      source: "matter_events",
      matterUuid: row.matter_id,
      matterId: id.matterId,
      clientName: id.clientName,
      eventName: row.event_type,
      description: row.notes,
      actor: row.actor,
      currentState: id.currentState,
      occurredAt: row.created_at,
      metadata: row.metadata,
      matterHref: id.matterHref,
    });
  }

  for (const row of dealEvents) {
    const id = identity(row.deal_id);
    entries.push({
      id: `deal:${row.id}`,
      source: "deal_events",
      matterUuid: row.deal_id,
      matterId: id.matterId,
      clientName: id.clientName,
      eventName: row.event,
      description: payloadDescription(row.payload),
      actor:
        typeof row.payload?.actor === "string"
          ? row.payload.actor
          : typeof row.payload?.actor_email === "string"
            ? row.payload.actor_email
            : null,
      currentState: id.currentState,
      occurredAt: row.created_at,
      metadata: row.payload,
      matterHref: id.matterHref,
    });
  }

  for (const row of custodyEvents) {
    const id = identity(row.deal_id);
    const context = [row.status, row.method, row.location]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(" · ");

    entries.push({
      id: `custody:${row.id}`,
      source: "custody_ledger",
      matterUuid: row.deal_id,
      matterId: id.matterId,
      clientName: id.clientName,
      eventName: row.event,
      description: row.notes ?? (context || null),
      actor: row.actor_id ?? row.actor_type,
      currentState: id.currentState,
      occurredAt: row.created_at,
      metadata: row.metadata,
      matterHref: id.matterHref,
    });
  }

  entries.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  return {
    generatedAt: new Date().toISOString(),
    matterFilter,
    entries: entries.slice(0, limit),
    sourceErrors,
    degraded: sourceErrors.length > 0,
  };
}
