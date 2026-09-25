// Server-side loader for the authority packet manifest. Recomputes the packet
// from canonical evidence on every read; the browser never supplies packet
// status, fee, form or readiness.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  composeAuthorityPacket,
  readRecordedAuthorityPacket,
  type AuthorityPacketManifest,
} from "./authorityPacket";
import {
  AUTHORITY_ASSET_FIELDS,
  FLORIDA_DOS_APOSTILLE_FORM,
  STATE_AUTHORITY_FIELDS,
  type AuthoritySourceAsset,
  type StateAuthorityRecord,
} from "./stateAuthorityProvenance";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LoadedAuthorityPacket {
  matter: { id: string; deal_id: string | null; updated_at: string; execution_truth: unknown };
  manifest: AuthorityPacketManifest;
}

export async function loadAuthorityPacket(matterRef: string, now: Date = new Date()): Promise<LoadedAuthorityPacket | null> {
  const supabase = createAdminClient();
  const base = supabase
    .from("deals")
    .select("id, deal_id, status, deal_status, destination_country, execution_truth, updated_at");
  const { data: matter } = UUID_RE.test(matterRef)
    ? await base.or(`id.eq.${matterRef},deal_id.eq.${matterRef}`).maybeSingle()
    : await base.eq("deal_id", matterRef).maybeSingle();
  if (!matter) return null;

  const recorded = readRecordedAuthorityPacket(matter.execution_truth);
  const authorityQuery = supabase.from("state_authorities").select(STATE_AUTHORITY_FIELDS);
  const [{ data: files }, { data: sessions }, { data: authority }] = await Promise.all([
    supabase
      .from("files")
      .select("id, name, filename, mime_type, file_type, structural_status, structural_review_reason")
      .eq("deal_id", matter.id)
      .eq("is_internal", false),
    supabase
      .from("ron_sessions")
      .select("milano_ron_status, created_at")
      .eq("matter_id", matter.id)
      .order("created_at", { ascending: false })
      .limit(1),
    recorded?.authority_id
      ? authorityQuery.eq("id", recorded.authority_id).maybeSingle()
      : authorityQuery
          .eq("state_code", FLORIDA_DOS_APOSTILLE_FORM.stateCode)
          .eq("authority_name", FLORIDA_DOS_APOSTILLE_FORM.authorityName)
          .maybeSingle(),
  ]);
  const authorityRecord = (authority ?? null) as unknown as StateAuthorityRecord | null;
  const { data: assets } = authorityRecord?.id
    ? await supabase.from("authority_source_assets").select(AUTHORITY_ASSET_FIELDS).eq("authority_id", authorityRecord.id)
    : { data: [] };

  const manifest = composeAuthorityPacket(
    {
      matterId: matter.id,
      matterState: matter.status ?? matter.deal_status ?? null,
      destinationCountry: matter.destination_country ?? null,
      executionTruth: matter.execution_truth,
      files: files ?? [],
      ronSessionStatus: sessions?.[0]?.milano_ron_status ?? null,
      authority: authorityRecord,
      assets: (assets ?? []) as AuthoritySourceAsset[],
      recorded,
    },
    now,
  );
  return { matter, manifest };
}
