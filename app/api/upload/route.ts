import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 415 }
      );
    }
    if (file.size > MAX_SIZE) {
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
      })
      .select("id, deal_id, filename, file_type, file_size, uploaded_by, created_at")
      .single();

    // STORAGE-VAULT-01: return signed URL but never storage_path or file_path
    return NextResponse.json({ success: true, file: { ...fileRecord, url: fileUrl } });
  } catch (err: unknown) {
    const { logger } = await import("@/lib/logger");
    logger.error("api/upload", "Upload failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
