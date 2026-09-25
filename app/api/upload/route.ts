import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DOCUMENT_PREFLIGHT_MAX_BYTES,
  DOCUMENT_PREFLIGHT_SUPPORTED_MIME_TYPES,
  inspectDocumentPreflight,
} from "@/lib/intelligence/execution-brain/documentPreflight";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const deal_id = form.get("deal_id") as string;
    const uploaded_by = form.get("uploaded_by") as string | null;

    if (!file || !deal_id) {
      return NextResponse.json(
        { error: "Missing file or deal_id" },
        { status: 400 }
      );
    }
    if (!DOCUMENT_PREFLIGHT_SUPPORTED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 415 }
      );
    }
    if (file.size > DOCUMENT_PREFLIGHT_MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 20MB limit" },
        { status: 413 }
      );
    }

    const supabase = createAdminClient();

    // Verify deal exists
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .select("id")
      .eq("id", deal_id)
      .single();
    if (dealErr || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const preflight = await inspectDocumentPreflight({
      bytes: buffer,
      mimeType: file.type,
      fileName: file.name,
    });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${deal_id}/${Date.now()}-${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    // SECURITY-05/06: Signed URL — bucket must be private; no public CDN path exposed.
    const { data: signedData } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 60 * 60 * 24 * 7); // 7-day signed URL

    const fileUrl = signedData?.signedUrl ?? null;

    const { data: fileRecord } = await supabase
      .from("files")
      .insert({
        deal_id,
        filename: file.name,
        file_url: fileUrl,
        file_path: path,
        storage_path: path,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: uploaded_by || "client",
        sha256: preflight.sha256,
        signature_detected: preflight.signatureDetected,
        certification_signature_detected: preflight.certificationSignatureDetected,
        encryption_detected: preflight.encryptionDetected,
        structural_status: preflight.status,
        structural_review_reason: preflight.reviewReason,
        preflight_scanner_version: preflight.scannerVersion,
        preflight_checked_at: preflight.checkedAt,
      })
      .select(
        "id, deal_id, filename, file_type, file_size, uploaded_by, created_at, structural_status, structural_review_reason, signature_detected, certification_signature_detected, encryption_detected, preflight_checked_at",
      )
      .single();

    // STORAGE-VAULT-01: return signed URL but never storage_path, file_path or SHA-256.
    return NextResponse.json({
      success: true,
      file: {
        ...fileRecord,
        url: fileUrl,
        preflight: {
          status: preflight.status,
          review_required: preflight.status === "REVIEW_REQUIRED",
          blocked: preflight.status === "BLOCKED",
          reason: preflight.reviewReason,
        },
      },
    });
  } catch (err: unknown) {
    const { logger } = await import("@/lib/logger");
    logger.error("api/upload", "Upload failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
