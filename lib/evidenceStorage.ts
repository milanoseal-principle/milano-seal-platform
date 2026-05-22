import { createAdminClient } from "@/lib/supabase/admin";
import { generateEvidencePacket } from "@/lib/evidencePacket";
import { appendLedger } from "@/lib/custodyLedger";
import { audit } from "@/lib/audit";

const BUCKET = "evidence";

export interface EvidenceUploadResult {
  ok: boolean;
  path?: string;
  url?: string;
  signed_url?: string;
  skipped?: boolean;
  error?: string;
}

export interface EvidenceUploadOptions {
  force?: boolean;
  signedUrlSeconds?: number;
}

export async function uploadEvidencePacket(
  deal_id: string,
  opts: EvidenceUploadOptions = {},
): Promise<EvidenceUploadResult> {
  const supabase = createAdminClient();

  try {
    const { data: existing } = await supabase
      .from("deals")
      .select("evidence_path, evidence_generated_at")
      .eq("id", deal_id)
      .single();

    if (existing?.evidence_path && !opts.force) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(
          existing.evidence_path as string,
          opts.signedUrlSeconds ?? 60 * 60 * 24 * 7,
        );
      return {
        ok: true,
        skipped: true,
        path: existing.evidence_path as string,
        signed_url: signed?.signedUrl,
      };
    }

    const bytes = await generateEvidencePacket(deal_id);
    const path = `${deal_id}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, Buffer.from(bytes), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadErr) {
      return { ok: false, error: `Upload failed: ${uploadErr.message}` };
    }

    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, opts.signedUrlSeconds ?? 60 * 60 * 24 * 7);

    await supabase
      .from("deals")
      .update({
        evidence_path: path,
        evidence_url: signed?.signedUrl ?? null,
        evidence_generated_at: new Date().toISOString(),
      })
      .eq("id", deal_id);

    await appendLedger({
      deal_id,
      event: "EVIDENCE_PACKET_CREATED",
      actor_type: "system",
      location: "Milano Seal · Archive",
      method: "archive",
      status: "released",
      metadata: { path, bytes: bytes.length },
    });

    void audit({
      event: "evidence.generated",
      resource: `deal:${deal_id}`,
      payload: { path, bytes: bytes.length },
    });

    return {
      ok: true,
      path,
      signed_url: signed?.signedUrl,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[evidenceStorage] failed:", msg);
    return { ok: false, error: msg };
  }
}

export async function refreshEvidenceSignedUrl(
  deal_id: string,
  seconds = 60 * 60 * 24 * 7,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("deals")
    .select("evidence_path")
    .eq("id", deal_id)
    .single();
  if (!data?.evidence_path) return null;
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.evidence_path as string, seconds);
  return signed?.signedUrl ?? null;
}
