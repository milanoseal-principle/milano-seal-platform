// Server context for authority logistics routes: operator authorization and
// canonical Matter / packet / leg loading. The browser never supplies gate
// facts, packet status, rates or custody.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOperatorOrFounder } from "@/lib/security/access-control";
import { loadAuthorityPacket } from "./authorityPacketServer";
import { getMatterShipmentLegs, type LogisticsMatterFacts, type ShipmentLegRow } from "./authorityLogistics";
import type { AuthorityPacketProjection } from "./authorityPacket";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function authorizeLogisticsOperator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) } as const;
  const role = user.app_metadata?.role as string | undefined;
  if (!isOperatorOrFounder(role)) return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) } as const;
  return { user, role: role ?? "" } as const;
}

export interface LogisticsMatterRow {
  id: string;
  deal_id: string | null;
  status: string | null;
  deal_status: string | null;
  tier: string | null;
  client_name: string | null;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  document_count: number | null;
  destination_country: string | null;
  country: string | null;
  shipping_street1: string | null;
  shipping_street2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip: string | null;
  apostille_required: boolean | null;
  release_frozen: boolean | null;
  is_paid_and_released: boolean | null;
}

export interface LogisticsContext {
  admin: ReturnType<typeof createAdminClient>;
  matter: LogisticsMatterRow;
  facts: LogisticsMatterFacts;
  packet: AuthorityPacketProjection | null;
  legs: ShipmentLegRow[];
}

export async function loadLogisticsContext(matterRef: string): Promise<LogisticsContext | null> {
  const admin = createAdminClient();
  const base = admin
    .from("deals")
    .select(
      "id, deal_id, status, deal_status, tier, client_name, email, phone, document_type, document_count, destination_country, country, shipping_street1, shipping_street2, shipping_city, shipping_state, shipping_zip, apostille_required, release_frozen, is_paid_and_released",
    );
  const { data } = UUID_RE.test(matterRef)
    ? await base.or(`id.eq.${matterRef},deal_id.eq.${matterRef}`).maybeSingle()
    : await base.eq("deal_id", matterRef).maybeSingle();
  if (!data) return null;
  const matter = data as unknown as LogisticsMatterRow;
  const [packetContext, legs] = await Promise.all([loadAuthorityPacket(matter.id), getMatterShipmentLegs(admin, matter.id)]);
  return {
    admin,
    matter,
    facts: {
      id: matter.id,
      state: matter.status ?? matter.deal_status ?? null,
      apostilleRequired: matter.apostille_required,
      releaseFrozen: matter.release_frozen,
      isPaidAndReleased: matter.is_paid_and_released,
    },
    packet: packetContext?.projection ?? null,
    legs,
  };
}

export const LEG_RPC_ERRORS: Record<string, number> = {
  EVIDENCE_NOTE_REQUIRED: 400,
  INVALID_LEG_TYPE: 400,
  SHIPMENT_LEG_NOT_FOUND: 404,
  LABEL_ALREADY_PURCHASED: 409,
  RATE_SNAPSHOT_INCOMPLETE: 400,
  LABEL_PURCHASE_NOT_PERMITTED: 409,
  LABEL_PURCHASE_NOT_PENDING: 409,
  TRANSACTION_REQUIRED: 502,
  RETURN_LEG_DISPATCHED_BY_AUTHORITY: 409,
  LABEL_REQUIRED_BEFORE_DISPATCH: 409,
  LEG_ALREADY_DISPATCHED: 409,
  LABEL_NOT_VOIDABLE: 409,
};

export function legRpcError(message: string | undefined) {
  if (message && message in LEG_RPC_ERRORS) return NextResponse.json({ error: message }, { status: LEG_RPC_ERRORS[message] });
  if (message && /matter_shipment_legs_active_type_uidx|matter_shipment_legs_matter_sequence_key|duplicate key/i.test(message)) {
    return NextResponse.json({ error: "LEG_ALREADY_ACTIVE" }, { status: 409 });
  }
  return NextResponse.json({ error: "SHIPMENT_LEG_PERSISTENCE_FAILED" }, { status: 500 });
}
