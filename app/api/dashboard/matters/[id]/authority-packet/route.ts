import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { loadAuthorityPacket } from "@/lib/intelligence/execution-brain/authorityPacketServer";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["build", "assemble", "approve"]);
const ROUTE_TYPES = new Set(["florida_dos_apostille", "florida_dos_notarial_certificate", "other"]);
const FEE_METHOD = new Set(["ready", "not_ready", "unknown"]);
const RETURN_SHIPPING = new Set(["required", "not_required", "unknown"]);

const RPC_ERRORS: Record<string, number> = {
  PACKET_ALREADY_DISPATCHED: 409,
  PACKET_NOT_BUILT: 409,
  PACKET_NOT_READY_TO_ASSEMBLE: 409,
  PACKET_NOT_ASSEMBLED: 409,
  PACKET_QA_NOT_PERMITTED: 409,
  UNKNOWN_AUTHORITY: 400,
  INVALID_ROUTE_TYPE: 400,
  INVALID_DOCUMENT_COUNT: 400,
  INVALID_DESTINATION_CONFIRMATION: 400,
  INVALID_FEE_METHOD_STATUS: 400,
  INVALID_RETURN_SHIPPING: 400,
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const loaded = await loadAuthorityPacket(id);
  if (!loaded) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ packet: loaded.manifest });
}

// BUILD AUTHORITY PACKET: record operator packet facts, then assemble and
// record final QA. The server recomputes the packet from canonical evidence
// before every lifecycle step; the request cannot supply status, fee or form.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim();
  if (!ACTIONS.has(action)) return NextResponse.json({ error: "INVALID_PACKET_ACTION" }, { status: 400 });

  const facts: Record<string, unknown> = {};
  if (action === "build") {
    if (body.authority_id !== undefined) {
      if (typeof body.authority_id !== "string" || !UUID_RE.test(body.authority_id)) {
        return NextResponse.json({ error: "INVALID_AUTHORITY_ID" }, { status: 400 });
      }
      facts.authority_id = body.authority_id;
    }
    if (body.route_type !== undefined) {
      if (!ROUTE_TYPES.has(String(body.route_type))) return NextResponse.json({ error: "INVALID_ROUTE_TYPE" }, { status: 400 });
      facts.route_type = String(body.route_type);
    }
    if (body.document_count !== undefined) {
      const count = Number(body.document_count);
      if (!Number.isInteger(count) || count < 1 || count > 500) {
        return NextResponse.json({ error: "INVALID_DOCUMENT_COUNT" }, { status: 400 });
      }
      facts.document_count = count;
    }
    if (body.destination_confirmed !== undefined) {
      if (typeof body.destination_confirmed !== "boolean") {
        return NextResponse.json({ error: "INVALID_DESTINATION_CONFIRMATION" }, { status: 400 });
      }
      facts.destination_confirmed = body.destination_confirmed;
    }
    if (body.government_fee_method_status !== undefined) {
      if (!FEE_METHOD.has(String(body.government_fee_method_status))) {
        return NextResponse.json({ error: "INVALID_FEE_METHOD_STATUS" }, { status: 400 });
      }
      facts.government_fee_method_status = String(body.government_fee_method_status);
    }
    if (body.return_shipping !== undefined) {
      if (!RETURN_SHIPPING.has(String(body.return_shipping))) {
        return NextResponse.json({ error: "INVALID_RETURN_SHIPPING" }, { status: 400 });
      }
      facts.return_shipping = String(body.return_shipping);
    }
  }

  const evidenceNote = String(body.evidence_note ?? "").trim();
  if (evidenceNote.length < 10) {
    return NextResponse.json(
      { error: "EVIDENCE_NOTE_REQUIRED", message: "Record the evidence basis for this packet step." },
      { status: 400 },
    );
  }

  const loaded = await loadAuthorityPacket(id);
  if (!loaded) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  if (action === "assemble" && loaded.manifest.packet_status !== "READY_TO_ASSEMBLE") {
    return NextResponse.json(
      { error: "PACKET_NOT_READY_TO_ASSEMBLE", missing_items: loaded.manifest.missing_items },
      { status: 409 },
    );
  }
  if (action === "approve" && loaded.manifest.packet_status !== "ASSEMBLED") {
    return NextResponse.json(
      { error: "PACKET_QA_NOT_PERMITTED", missing_items: loaded.manifest.missing_items },
      { status: 409 },
    );
  }

  const { data, error } = await createAdminClient().rpc("record_matter_authority_packet", {
    p_matter_id: loaded.matter.id,
    p_expected_updated_at: loaded.matter.updated_at,
    p_action: action,
    p_facts: facts,
    p_computed_status: loaded.manifest.packet_status,
    p_actor_id: auth.user.id,
    p_occurred_at: new Date().toISOString(),
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
  return NextResponse.json({ success: true, packet: refreshed?.manifest ?? null });
}
