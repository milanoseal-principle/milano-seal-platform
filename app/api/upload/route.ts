import {persistUploadedVersion} from '@/lib/documents/versions';
import {authorizeMatterUpload} from '@/lib/uploads/authorization';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PORTAL_URL_EXPIRY_SECONDS } from "@/lib/vault";
import {
  DOCUMENT_PREFLIGHT_MAX_BYTES,
  DOCUMENT_PREFLIGHT_SUPPORTED_MIME_TYPES,
  inspectDocumentPreflight,
  preflightColumns,
} from "@/lib/intelligence/execution-brain/documentPreflight";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const deal_id = form.get("deal_id") as string;


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

  const uploadAuthority=await authorizeMatterUpload(req,deal_id,false);
  if(!uploadAuthority)return NextResponse.json({error:'UPLOAD_NOT_AUTHORIZED',next_action:'Use the same browser immediately after intake, or sign in to the account that owns this Matter.'},{status:403});
    const uploaded_by=uploadAuthority.actorId;
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
      .createSignedUrl(path, PORTAL_URL_EXPIRY_SECONDS); // same 15-minute vault window as the portal

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
        // Canonical name/mime columns read by RON readiness (migration 081).
        name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        ...preflightColumns(preflight),
      })
      .select(
        "id, deal_id, filename, file_type, file_size, uploaded_by, created_at, structural_status, structural_review_reason, signature_detected, certification_signature_detected, encryption_detected, preflight_checked_at",
      )
      .single();

    if(!fileRecord)return NextResponse.json({error:'UPLOAD_RECORD_NOT_CONFIRMED'},{status:503});
    await persistUploadedVersion(supabase,{matterId:deal_id,path:path,bucket:'documents',bytes:buffer,mime:file.type,name:file.name,actor:uploaded_by,documentId:String(fileRecord.id)});
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
