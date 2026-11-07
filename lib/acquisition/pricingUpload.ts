import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { inspectDocumentPreflight } from "@/lib/intelligence/execution-brain/documentPreflight";

// Optional secure document upload for a persisted Get Pricing request. It reuses
// the EXISTING private `deal-documents` bucket and the existing structural
// preflight — no public bucket, no permanent public URL, and no new storage
// policy. Uploads attach to the pricing request (public.sales_leads row,
// lead_type = 'pricing_request') WITHOUT creating a Matter, payment or
// scheduling state. The request_id is preserved: objects are stored under
// `pricing-requests/<request_id>/…` so the later operator lead -> Matter
// transition can carry the same reference forward. Document contents and
// sensitive metadata are never placed in analytics, notification email, logs
// or URLs; only non-sensitive references (storage path, name, size, type,
// sha256, preflight verdict) are recorded on the lead.

const BUCKET = "deal-documents";
const PREFIX = "pricing-requests";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 10;
const MAX_UPLOADS_PER_REQUEST = 20;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Dependencies = { admin: () => SupabaseClient };

// A stored reference only — never the document bytes.
export interface PricingUploadRef {
  storage_path: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  preflight_status: string;
  preflight_reasons: string[];
  uploaded_at: string;
}

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function safeExt(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "bin";
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "bin";
}

export async function receivePricingUpload(
  request: Request,
  dependencies: Dependencies = { admin: createAdminClient },
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return fail("Please submit from the Milano website.", 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("Invalid upload.", 400);
  }

  const requestId = String(formData.get("request_id") ?? "");
  if (!UUID.test(requestId)) return fail("A valid pricing request reference is required.", 400);

  const files = (formData.getAll("files") as File[]).filter((f) => f && typeof f.arrayBuffer === "function");
  if (!files.length) return fail("Attach at least one document, or submit without documents.", 400);

  const admin = dependencies.admin();

  // Uploads attach only to an already-persisted pricing request. This route
  // never creates a lead, a Matter, a payment or a scheduling state.
  const { data: lead, error: lookupError } = await admin
    .from("sales_leads")
    .select("id,details")
    .eq("id", requestId)
    .eq("lead_type", "pricing_request")
    .maybeSingle();
  if (lookupError) return fail("We could not attach your documents right now. Please retry.", 503);
  if (!lead) return fail("That pricing request could not be found.", 404);

  const details = (lead.details && typeof lead.details === "object" ? lead.details : {}) as Record<string, unknown>;
  const existing: PricingUploadRef[] = Array.isArray(details.uploads) ? (details.uploads as PricingUploadRef[]) : [];
  const bySha = new Map(existing.map((u) => [u.sha256, u]));

  const errors: string[] = [];
  let changed = false;

  for (const file of files.slice(0, MAX_FILES)) {
    if (file.size > MAX_FILE_SIZE) { errors.push(`${file.name}: exceeds the 20 MB limit`); continue; }
    if (!ALLOWED_TYPES.has(file.type)) { errors.push(`${file.name}: unsupported file type`); continue; }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      errors.push(`${file.name}: could not be read`);
      continue;
    }

    // Existing structural / magic-byte preflight. A BLOCKED verdict (empty,
    // unsupported, or a file whose bytes do not match a parseable document)
    // is rejected before any storage write.
    const preflight = await inspectDocumentPreflight({ bytes, mimeType: file.type, fileName: file.name });
    if (preflight.status === "BLOCKED") {
      errors.push(`${file.name}: ${preflight.reviewReason ?? "failed document validation"}`);
      continue;
    }

    // Content-addressed path makes retries idempotent: the same bytes resolve
    // to the same object and the same uploads entry, never a duplicate.
    if (bySha.has(preflight.sha256)) continue;
    if (bySha.size >= MAX_UPLOADS_PER_REQUEST) { errors.push(`${file.name}: too many documents attached`); continue; }

    const storagePath = `${PREFIX}/${requestId}/${preflight.sha256}.${safeExt(file.name)}`;
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: file.type, upsert: true });
    if (uploadError) {
      // Storage failure must never destroy the persisted pricing request; the
      // caller surfaces a governed retry path instead.
      errors.push(`${file.name}: upload did not complete`);
      continue;
    }

    const ref: PricingUploadRef = {
      storage_path: storagePath,
      name: file.name.slice(0, 255),
      mime_type: file.type,
      size_bytes: file.size,
      sha256: preflight.sha256,
      preflight_status: preflight.status,
      preflight_reasons: preflight.reasonCodes,
      uploaded_at: new Date().toISOString(),
    };
    bySha.set(ref.sha256, ref);
    changed = true;
  }

  if (changed) {
    const { error: updateError } = await admin
      .from("sales_leads")
      .update({ details: { ...details, uploads: [...bySha.values()] } })
      .eq("id", requestId)
      .eq("lead_type", "pricing_request");
    if (updateError) {
      // The documents are stored but the reference could not be recorded;
      // report attention rather than claim success.
      return NextResponse.json({
        ok: false,
        reference: requestId,
        requires_attention: true,
        error: "Your documents were received but could not be attached. Please retry.",
      }, { status: 503 });
    }
  }

  const uploaded = [...bySha.values()].map((u) => ({
    name: u.name,
    size_bytes: u.size_bytes,
    mime_type: u.mime_type,
    preflight_status: u.preflight_status,
  }));

  return NextResponse.json({
    ok: errors.length === 0,
    reference: requestId,
    uploaded,
    errors,
    requires_attention: errors.length > 0,
  }, { status: errors.length ? 207 : 200 });
}
