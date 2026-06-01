import { NextRequest, NextResponse } from "next/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { appendLedger } from "@/lib/custodyLedger";
import { VAULT_BUCKET } from "@/lib/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  const ctx = await getCurrentClientDeal(dealId);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deal) {
    return NextResponse.json({ error: "No active matter found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const label = ((formData.get("label") as string) ?? "").trim().slice(0, 120);

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Accepted: PDF, JPEG, PNG, TIFF." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 25 MB limit." },
      { status: 413 },
    );
  }

  const ext = file.type === "application/pdf" ? "pdf"
    : file.type === "image/jpeg" ? "jpg"
    : file.type === "image/png" ? "png"
    : file.type === "image/tiff" ? "tiff"
    : "bin";

  const timestamp = Date.now();
  // Path pattern: {deal_id}/client-uploads/{timestamp}.{ext}
  // Never exposed to client — only referenced internally
  const storagePath = `${ctx.deal.id}/client-uploads/${timestamp}.${ext}`;

  const buffer = await file.arrayBuffer();
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from(VAULT_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }

  const documentLabel = label || `Client Upload — ${new Date().toLocaleDateString("en-US")}`;

  // Record in documents table (pending verification status)
  const { data: docRow, error: dbError } = await admin
    .from("documents")
    .insert({
      matter_id: ctx.deal.id,
      document_label: documentLabel,
      storage_path: storagePath,
      source: "client_portal",
      verification_status: "pending",
      uploaded_by: ctx.email,
    })
    .select("id")
    .single();

  if (dbError) {
    // Storage upload succeeded but DB record failed — log and surface gracefully
    console.error("Document record insert failed:", dbError.message);
    return NextResponse.json(
      { error: "File received but record could not be saved. Contact support." },
      { status: 500 },
    );
  }

  // Chain-of-custody entry
  await appendLedger({
    deal_id: ctx.deal.id,
    event: "DOC_RECEIVED",
    actor_type: "client",
    actor_id: ctx.email,
    notes: `Client uploaded document via portal: "${documentLabel}"`,
    metadata: {
      document_id: docRow?.id,
      file_type: file.type,
      file_size_bytes: file.size,
      source: "client_portal",
    },
  });

  return NextResponse.json({ success: true, document_id: docRow?.id });
}
