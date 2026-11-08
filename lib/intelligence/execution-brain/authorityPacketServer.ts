// Server-side loader for the authority packet projection. Recomputes the packet
// from canonical evidence on every read; the browser never supplies packet
// status, fee, form, documents or readiness.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  composeAuthorityPacket,
  readRecordedAuthorityPacket,
  type AuthorityPacketProjection,
  type CustodyEvidenceRow,
  type PacketFileRow,
} from "./authorityPacket";
import { loadMatterRoute } from "./matterRouteServer";
import { readRonAuthorityPosture } from "./ronProviderCapabilities";
import {
  AUTHORITY_ASSET_FIELDS,
  FLORIDA_DOS_APOSTILLE_FORM,
  STATE_AUTHORITY_FIELDS,
  type AuthoritySourceAsset,
  type StateAuthorityRecord,
} from "./stateAuthorityProvenance";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AuthorityPacketContext {
  matter: { id: string; deal_id: string | null; updated_at: string; execution_truth: unknown };
  compose: (executionTruth?: unknown) => AuthorityPacketProjection;
  projection: AuthorityPacketProjection;
}

export async function loadAuthorityPacket(
  matterRef: string,
  options: { authorityId?: string | null; now?: Date } = {},
): Promise<AuthorityPacketContext | null> {
  const now = options.now ?? new Date();
  const supabase = createAdminClient();
  const base = supabase
    .from("deals")
    .select("id, deal_id, status, deal_status, destination_country, origin_state, document_type, execution_truth, updated_at");
  const { data: matter } = UUID_RE.test(matterRef)
    ? await base.or(`id.eq.${matterRef},deal_id.eq.${matterRef}`).maybeSingle()
    : await base.eq("deal_id", matterRef).maybeSingle();
  if (!matter) return null;

  const recorded = readRecordedAuthorityPacket(matter.execution_truth);
  const authorityId = options.authorityId ?? recorded?.authority_id ?? null;
  const authorityQuery = supabase.from("state_authorities").select(STATE_AUTHORITY_FIELDS);
  const [{ data: files }, { data: sessions }, { data: custody }, { data: authority }] = await Promise.all([
    supabase
      .from("files")
      .select("id, name, filename, category, mime_type, file_type, sha256, storage_path, structural_status, structural_review_reason")
      .eq("deal_id", matter.id)
      .eq("is_internal", false),
    supabase
      .from("ron_sessions")
      .select("milano_ron_status, ron_lifecycle_state, created_at")
      .eq("matter_id", matter.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("custody_ledger").select("event, created_at").eq("deal_id", matter.id),
    authorityId
      ? authorityQuery.eq("id", authorityId).maybeSingle()
      : recorded?.route_type?.startsWith("florida_dos")
        ? authorityQuery
            .eq("state_code", FLORIDA_DOS_APOSTILLE_FORM.stateCode)
            .eq("authority_name", FLORIDA_DOS_APOSTILLE_FORM.authorityName)
            .maybeSingle()
        : Promise.resolve({ data: null }),
  ]);
  const authorityRecord = (authority ?? null) as unknown as StateAuthorityRecord | null;
  const { data: assets } = authorityRecord?.id
    ? await supabase.from("authority_source_assets").select(AUTHORITY_ASSET_FIELDS).eq("authority_id", authorityRecord.id)
    : { data: [] };

  const route = await loadMatterRoute(supabase, matter, readRonAuthorityPosture(matter.execution_truth).receivingAuthority);

  const compose = (executionTruth: unknown = matter.execution_truth) =>
    composeAuthorityPacket(
      {
        matterId: matter.id,
        matterState: matter.status ?? matter.deal_status ?? null,
        destinationCountry: matter.destination_country ?? null,
        documentType: matter.document_type ?? null,
        executionTruth,
        files: (files ?? []) as PacketFileRow[],
        // Only Milano-verified RON completion counts as executed; provider completion does not.
        ronSessionStatus: sessions?.[0]?.ron_lifecycle_state === "COMPLETED" ? sessions[0].milano_ron_status ?? "RON_COMPLETED" : null,
        authority: authorityRecord,
        assets: (assets ?? []) as AuthoritySourceAsset[],
        custodyEvents: (custody ?? []) as CustodyEvidenceRow[],
        issuingLane: route.issuingLane,
      },
      now,
    );
  return { matter, compose, projection: compose() };
}
