// STORAGE-VAULT-01: Signed document URL generation
// Service-role only. Never called from client. Never returns storage paths.

import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";

export const VAULT_BUCKET = "documents";

// Portal-facing signed URLs expire in 15 minutes.
// Operator-facing (admin download) expire in 1 hour.
export const PORTAL_URL_EXPIRY_SECONDS = 900;
export const OPERATOR_URL_EXPIRY_SECONDS = 3600;

export interface VaultDocument {
  document_id: string;
  matter_id: string;
  document_label: string;
  uploaded_at: string;
  verification_status: "released" | "processing" | "pending";
  signed_url: string | null;
}

/**
 * Fetch all documents for a matter from the client-safe view and return
 * records with short-lived signed URLs. Raw storage_path is never returned.
 */
export async function getVaultDocumentsForMatter(
  matterId: string,
  actorEmail: string,
): Promise<VaultDocument[]> {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("client_safe_documents_view")
    .select("document_id, matter_id, document_label, storage_path, uploaded_at, verification_status")
    .eq("matter_id", matterId)
    .order("uploaded_at", { ascending: false });

  if (!rows?.length) return [];

  const documents = await Promise.all(
    rows.map(async (row) => {
      let signedUrl: string | null = null;

      if (row.storage_path) {
        const { data: signed } = await admin.storage
          .from(VAULT_BUCKET)
          .createSignedUrl(row.storage_path, PORTAL_URL_EXPIRY_SECONDS);
        signedUrl = signed?.signedUrl ?? null;
      }

      return {
        document_id: row.document_id as string,
        matter_id: row.matter_id as string,
        document_label: row.document_label as string,
        uploaded_at: row.uploaded_at as string,
        verification_status: row.verification_status as VaultDocument["verification_status"],
        signed_url: signedUrl,
      };
    }),
  );

  await audit({
    event: "portal.document_list.accessed",
    actor: actorEmail,
    resource: `matters:${matterId}`,
    payload: {
      document_count: documents.length,
      url_expiry_seconds: PORTAL_URL_EXPIRY_SECONDS,
    },
  });

  return documents;
}

/**
 * Generate a single short-lived signed URL for a specific document,
 * after verifying the document belongs to the expected matter.
 * Returns null if the file is not found or storage path is missing.
 */
export async function generateVaultSignedUrl(
  documentId: string,
  matterId: string,
  actorEmail: string,
): Promise<{ url: string; expires_in: number } | { error: string; status: 403 | 404 }> {
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("client_safe_documents_view")
    .select("document_id, matter_id, storage_path, document_label")
    .eq("document_id", documentId)
    .maybeSingle();

  if (!row) {
    return { error: "Document not found.", status: 404 };
  }

  if (row.matter_id !== matterId) {
    await audit({
      event: "portal.document.access_denied",
      actor: actorEmail,
      resource: `documents:${documentId}`,
      payload: { reason: "document does not belong to this matter", attempted_matter: matterId },
    });
    return { error: "Access denied: document not linked to this matter.", status: 403 };
  }

  if (!row.storage_path) {
    return { error: "Document is not yet available for download.", status: 403 };
  }

  const { data: signed, error: signErr } = await admin.storage
    .from(VAULT_BUCKET)
    .createSignedUrl(row.storage_path as string, PORTAL_URL_EXPIRY_SECONDS);

  if (signErr || !signed?.signedUrl) {
    return { error: "Failed to generate secure download link.", status: 403 };
  }

  await audit({
    event: "portal.document.downloaded",
    actor: actorEmail,
    resource: `documents:${documentId}`,
    payload: {
      matter_id: matterId,
      document_label: row.document_label,
      expires_in_seconds: PORTAL_URL_EXPIRY_SECONDS,
    },
  });

  return { url: signed.signedUrl, expires_in: PORTAL_URL_EXPIRY_SECONDS };
}
