import { NextResponse } from "next/server";

import { MATTER_STATES, type MatterState } from "@/data/matter-state-machine";
import {
  isOperationalTerminalState,
  operationalClientName,
  operationalDestinationCountry,
  operationalDocumentType,
  operationalDueAt,
  operationalMatterDisplayId,
  operationalPaymentStatus,
  resolveOperationalMatterState,
  type OperationalMatterSourceRow,
} from "@/lib/matter/canonicalOperationalRead";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PipelineSourceRow extends OperationalMatterSourceRow {
  id: string;
  deal_id?: string | null;
  lane?: string | null;
  execution_tier?: string | null;
  total_price?: number | string | null;
  final_total?: number | string | null;
  amount?: number | string | null;
  conversion_score?: number | null;
  priority_score?: number | null;
  priority_tier?: string | null;
  last_activity?: string | null;
  has_messages?: boolean | null;
}

const CANONICAL_PHASES: ReadonlyArray<{
  key: string;
  label: string;
  states: readonly MatterState[];
}> = [
  {
    key: "intake_review",
    label: "Intake & Review",
    states: [
      "intake_received",
      "under_review",
      "needs_client_info",
      "document_correction_required",
    ],
  },
  {
    key: "quote_deposit",
    label: "Quote & Deposit",
    states: [
      "quoted",
      "awaiting_deposit",
      "deposit_pending_review",
      "deposit_confirmed",
    ],
  },
  {
    key: "scheduling",
    label: "Scheduling",
    states: ["scheduling_unlocked", "scheduled"],
  },
  {
    key: "execution",
    label: "Execution",
    states: ["in_execution", "ron_completed", "execution_qa"],
  },
  {
    key: "apostille",
    label: "Apostille",
    states: [
      "apostille_packet_ready",
      "apostille_submitted",
      "apostille_processing",
      "apostille_received",
      "apostille_rejected",
    ],
  },
  {
    key: "final_payment",
    label: "Final Payment",
    states: [
      "final_balance_due",
      "final_payment_pending_review",
      "final_payment_confirmed",
    ],
  },
  {
    key: "release",
    label: "Release",
    states: ["ready_for_release", "final_packet_assembled", "label_created"],
  },
  {
    key: "transit",
    label: "Transit & Delivery",
    states: ["in_transit", "customs_watch", "out_for_delivery", "delivered"],
  },
  {
    key: "closed",
    label: "Closed",
    states: ["completed", "dormant", "lost", "cancelled"],
  },
];

const LEGACY_STAGE_ORDER = [
  "new",
  "reviewing",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille",
  "shipped",
  "completed",
  "lost",
] as const;

function numeric(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compatibilityStage(state: MatterState | null): string {
  if (!state) return "reviewing";
  if (state === "intake_received") return "new";
  if (["under_review", "needs_client_info", "document_correction_required"].includes(state)) {
    return "reviewing";
  }
  if (state === "quoted") return "quoted";
  if (["awaiting_deposit", "deposit_pending_review", "deposit_confirmed", "scheduling_unlocked"].includes(state)) {
    return "awaiting_payment";
  }
  if (state === "scheduled") return "scheduled";
  if (["in_execution", "ron_completed", "execution_qa"].includes(state)) {
    return "in_execution";
  }
  if (
    [
      "apostille_packet_ready",
      "apostille_submitted",
      "apostille_processing",
      "apostille_received",
      "apostille_rejected",
      "final_balance_due",
      "final_payment_pending_review",
      "final_payment_confirmed",
      "ready_for_release",
      "final_packet_assembled",
    ].includes(state)
  ) {
    return "apostille";
  }
  if (["label_created", "in_transit", "customs_watch", "out_for_delivery", "delivered"].includes(state)) {
    return "shipped";
  }
  if (state === "completed") return "completed";
  return "lost";
}

function phaseForState(state: MatterState | null): string {
  if (!state) return "unresolved";
  return CANONICAL_PHASES.find((phase) => phase.states.includes(state))?.key ?? "unresolved";
}

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deals")
    .select(
      [
        "id",
        "deal_id",
        "client_name",
        "full_name",
        "document_type",
        "document",
        "service_type",
        "destination_country",
        "country",
        "lane",
        "execution_tier",
        "total_price",
        "final_total",
        "amount",
        "status",
        "deal_status",
        "payment_status",
        "payment_confirmed",
        "payment_settlement_status",
        "due_at",
        "sla_deadline",
        "created_at",
        "updated_at",
        "last_activity",
        "conversion_score",
        "priority_score",
        "priority_tier",
        "has_messages",
        "tracking_number",
        "carrier",
        "delivery_status",
        "delivery_eta",
      ].join(", "),
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[pipeline] canonical read failed:", error.message);
    return NextResponse.json(
      { error: "PIPELINE_READ_FAILED", message: error.message },
      { status: 500 },
    );
  }

  const sourceRows = (data ?? []) as unknown as PipelineSourceRow[];

  const matters = sourceRows.map((row) => {
    const resolution = resolveOperationalMatterState(row);
    const total = numeric(row.final_total ?? row.total_price ?? row.amount);

    return {
      id: row.id,
      deal_id: operationalMatterDisplayId(row),
      client_name: operationalClientName(row),
      document_type: operationalDocumentType(row) ?? "Unknown document",
      destination_country: operationalDestinationCountry(row) ?? "Unknown destination",
      lane: row.lane ?? row.execution_tier ?? "—",
      total_price: total,
      canonical_state: resolution.state,
      raw_state: resolution.rawState,
      state_source: resolution.source,
      alias_applied: resolution.aliasApplied,
      phase: phaseForState(resolution.state),
      deal_status: compatibilityStage(resolution.state),
      payment_status: operationalPaymentStatus(row),
      payment_confirmed: row.payment_confirmed === true,
      due_at: operationalDueAt(row),
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
      last_activity: row.last_activity ?? null,
      conversion_score: row.conversion_score ?? 0,
      priority_score: row.priority_score ?? 0,
      priority_tier: row.priority_tier ?? null,
      has_messages: Boolean(row.has_messages),
      tracking_number: row.tracking_number ?? null,
      carrier: row.carrier ?? null,
      delivery_status: row.delivery_status ?? null,
    };
  });

  const stages = LEGACY_STAGE_ORDER.map((stage) => {
    const stageDeals = matters.filter((matter) => matter.deal_status === stage);
    return {
      stage,
      count: stageDeals.length,
      total_value: stageDeals.reduce((sum, matter) => sum + matter.total_price, 0),
      deals: stageDeals.slice(0, 50),
    };
  });

  const canonical_phases = [
    ...CANONICAL_PHASES.map((phase) => {
      const phaseDeals = matters.filter((matter) => matter.phase === phase.key);
      return {
        phase: phase.key,
        label: phase.label,
        count: phaseDeals.length,
        total_value: phaseDeals.reduce((sum, matter) => sum + matter.total_price, 0),
        deals: phaseDeals,
      };
    }),
    {
      phase: "unresolved",
      label: "Unresolved State",
      count: matters.filter((matter) => matter.phase === "unresolved").length,
      total_value: matters
        .filter((matter) => matter.phase === "unresolved")
        .reduce((sum, matter) => sum + matter.total_price, 0),
      deals: matters.filter((matter) => matter.phase === "unresolved"),
    },
  ].filter((phase) => phase.count > 0 || phase.phase !== "unresolved");

  const total_open = matters.filter((matter) => {
    const state = matter.canonical_state;
    return !isOperationalTerminalState(state);
  }).length;

  const total_value_open = matters
    .filter((matter) => !isOperationalTerminalState(matter.canonical_state))
    .reduce((sum, matter) => sum + matter.total_price, 0);

  const total_value_closed = matters
    .filter((matter) => matter.canonical_state === "completed")
    .reduce((sum, matter) => sum + matter.total_price, 0);

  const state_mismatch_count = sourceRows.filter((row) => {
    const status = row.status?.trim().toLowerCase() ?? null;
    const dealStatus = row.deal_status?.trim().toLowerCase() ?? null;
    return Boolean(status && dealStatus && status !== dealStatus);
  }).length;

  const unresolved_state_count = matters.filter(
    (matter) => !matter.canonical_state,
  ).length;

  return NextResponse.json({
    stages,
    canonical_phases,
    matters,
    total_open,
    total_value_open,
    total_value_closed,
    state_mismatch_count,
    unresolved_state_count,
    canonical_state_count: MATTER_STATES.length,
  });
}
