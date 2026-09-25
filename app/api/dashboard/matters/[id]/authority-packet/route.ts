import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import {
  PACKET_FEE_PAYMENT_METHOD_STATUSES,
  PACKET_QA_CONFIRMATIONS,
  PACKET_ROUTE_TYPES,
  RETURN_SHIPMENT_MODES,
  simulatePacketEvaluation,
  type AuthorityPacketProjection,
  type AuthorityPacketStatus,
  type PacketEvaluationFacts,
} from "@/lib/intelligence/execution-brain/authorityPacket";
import { loadAuthorityPacket } from "@/lib/intelligence/execution-brain/authorityPacketServer";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["evaluate", "assemble", "qa", "approve_dispatch"]);

/** Status each lifecycle action requires, recomputed on the server. */
const REQUIRED_STATUS: Record<string, AuthorityPacketStatus | null> = {
  evaluate: null,
  assemble: "READY_TO_ASSEMBLE",
  qa: "ASSEMBLED",
  approve_dispatch: "ASSEMBLED",
};

const RPC_ERRORS: Record<string, number> = {
  PACKET_ALREADY_DISPATCHED: 409,
  PACKET_NOT_EVALUATED: 409,
  PACKET_NOT_READY_TO_ASSEMBLE: 409,
  PACKET_NOT_ASSEMBLED: 409,
  PACKET_QA_NOT_PERMITTED: 409,
  PACKET_QA_INCOMPLETE: 400,
  PACKET_QA_NOT_COMPLETE: 409,
  PACKET_DISPATCH_NOT_PERMITTED: 409,
  UNKNOWN_AUTHORITY: 400,
  INVALID_PACKET_FACT: 400,
  INVALID_ROUTE_TYPE: 400,
  INVALID_DOCUMENT_COUNT: 400,
  INVALID_FEE_PAYMENT_METHOD: 400,
  INVALID_RETURN_SHIPMENT_MODE: 400,
  INVALID_PAPER_OUT_APPLICABILITY: 400,
  EVIDENCE_NOTE_REQUIRED: 400,
};

async function authorize() {
  const ssr = await createClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) } as const;
  const role = await resolveServerRole(user);
  if (!canPerformProtectedMatterTransition(role)) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) } as const;
  }
  return { user } as const;
}

function parseFacts(body: Record<string, unknown>): { facts: PacketEvaluationFacts } | { error: string } {
  const facts: PacketEvaluationFacts = {};
  if (body.authority_id !== undefined) {
    if (typeof body.authority_id !== "string" || !UUID_RE.test(body.authority_id)) return { error: "UNKNOWN_AUTHORITY" };
    facts.authority_id = body.authority_id;
  }
  if (body.route_type !== undefined) {
    if (!(PACKET_ROUTE_TYPES as readonly string[]).includes(String(body.route_type))) return { error: "INVALID_ROUTE_TYPE" };
    facts.route_type = body.route_type as PacketEvaluationFacts["route_type"];
  }
  if (body.document_count !== undefined) {
    const count = body.document_count;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 500) return { error: "INVALID_DOCUMENT_COUNT" };
    facts.document_count = count;
  }
  if (body.government_fee_payment_method !== undefined) {
    if (!(PACKET_FEE_PAYMENT_METHOD_STATUSES as readonly string[]).includes(String(body.government_fee_payment_method))) {
      return { error: "INVALID_FEE_PAYMENT_METHOD" };
    }
    facts.government_fee_payment_method = body.government_fee_payment_method as PacketEvaluationFacts["government_fee_payment_method"];
  }
  if (body.return_shipment_mode !== undefined) {
    if (!(RETURN_SHIPMENT_MODES as readonly string[]).includes(String(body.return_shipment_mode))) {
      return { error: "INVALID_RETURN_SHIPMENT_MODE" };
    }
    facts.return_shipment_mode = body.return_shipment_mode as PacketEvaluationFacts["return_shipment_mode"];
  }
  if (body.paper_out_not_applicable !== undefined) {
    if (typeof body.paper_out_not_applicable !== "boolean") return { error: "INVALID_PAPER_OUT_APPLICABILITY" };
    facts.paper_out_not_applicable = body.paper_out_not_applicable;
  }
  return { facts };
}

function evidenceOf(projection: AuthorityPacketProjection) {
  return {
    authority_id: projection.authorityId,
    missing_items: projection.missingItems,
    review_reasons: projection.reviewReasons,
    blockers: projection.blockers,
    source_asset: projection.officialFormAsset
      ? { id: projection.officialFormAsset.id, sha256: projection.officialFormAsset.sha256, resolution: projection.officialFormAsset.resolution }
      : null,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const loaded = await loadAuthorityPacket(id);
  if (!loaded) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ packet: loaded.projection });
}

// Operator packet actions: evaluate (record packet facts / refresh), assemble,
// qa and approve_dispatch. The server recomputes readiness from canonical
// evidence before every action; the request can never supply packet status,
// fee, form, documents or dispatch.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim();
  if (!ACTIONS.has(action)) return NextResponse.json({ error: "INVALID_PACKET_ACTION" }, { status: 400 });

  const evidenceNote = String(body.evidence_note ?? "").trim();
  if (evidenceNote.length < 10) {
    return NextResponse.json(
      { error: "EVIDENCE_NOTE_REQUIRED", message: "Record the evidence basis for this packet step." },
      { status: 400 },
    );
  }

  let facts: Record<string, unknown> = {};
  if (action === "evaluate") {
    const parsed = parseFacts(body);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    facts = { ...parsed.facts };
  } else if (action === "qa") {
    const qa = body.qa && typeof body.qa === "object" && !Array.isArray(body.qa) ? (body.qa as Record<string, unknown>) : {};
    for (const key of PACKET_QA_CONFIRMATIONS) {
      if (qa[key] !== true) return NextResponse.json({ error: "PACKET_QA_INCOMPLETE", field: key }, { status: 400 });
      facts[key] = true;
    }
  }

  const loaded = await loadAuthorityPacket(id);
  if (!loaded) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  const before = loaded.projection;
  const required = REQUIRED_STATUS[action];
  if (required && before.packetStatus !== required) {
    return NextResponse.json(
      { error: "PACKET_ACTION_NOT_PERMITTED", packet_status: before.packetStatus, missing_items: before.missingItems },
      { status: 409 },
    );
  }
  if (action === "approve_dispatch" && !before.operatorQa.complete) {
    return NextResponse.json({ error: "PACKET_QA_NOT_COMPLETE", missing_items: before.missingItems }, { status: 409 });
  }

  const occurredAt = new Date().toISOString();
  let statusAfter: AuthorityPacketStatus = before.packetStatus;
  if (action === "evaluate") {
    const simulated = simulatePacketEvaluation(loaded.matter.execution_truth, facts as PacketEvaluationFacts, occurredAt, auth.user.id);
    const authorityId = (facts as PacketEvaluationFacts).authority_id;
    const context = authorityId && authorityId !== before.authorityId ? await loadAuthorityPacket(loaded.matter.id, { authorityId }) : loaded;
    statusAfter = (context ?? loaded).compose(simulated).packetStatus;
  } else if (action === "assemble" || action === "qa") {
    statusAfter = "ASSEMBLED";
  } else {
    statusAfter = "READY_FOR_DISPATCH";
  }

  const { data, error } = await createAdminClient().rpc("record_matter_authority_packet", {
    p_matter_id: loaded.matter.id,
    p_expected_updated_at: loaded.matter.updated_at,
    p_action: action,
    p_facts: facts,
    p_computed_status: before.packetStatus,
    p_evidence: { ...evidenceOf(before), status_after: statusAfter },
    p_actor_id: auth.user.id,
    p_occurred_at: occurredAt,
    p_reason: evidenceNote.slice(0, 1000),
  });
  if (error?.code === "40001") {
    return NextResponse.json(
      { error: "STALE_MATTER_STATE", message: "The Matter changed. Refresh and try again." },
      { status: 409 },
    );
  }
  if (error && error.message in RPC_ERRORS) {
    return NextResponse.json({ error: error.message }, { status: RPC_ERRORS[error.message] });
  }
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.matter) {
    return NextResponse.json({ error: "AUTHORITY_PACKET_PERSISTENCE_FAILED" }, { status: 500 });
  }
  const refreshed = await loadAuthorityPacket(loaded.matter.id);
  return NextResponse.json({ success: true, packet: refreshed?.projection ?? null });
}
