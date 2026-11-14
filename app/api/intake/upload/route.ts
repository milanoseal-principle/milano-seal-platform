import {persistUploadedVersion} from '@/lib/documents/versions';
import {authorizeMatterUpload} from '@/lib/uploads/authorization';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  inspectDocumentPreflight,
  preflightColumns,
} from "@/lib/intelligence/execution-brain/documentPreflight";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 10;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const dealId = formData.get("deal_id") as string | null;
  if (!dealId) {
    return NextResponse.json({ error: "deal_id required" }, { status: 400 });
  }

  if(!await authorizeMatterUpload(req,dealId,true))return NextResponse.json({error:'UPLOAD_NOT_AUTHORIZED',next_action:'Use the same browser immediately after intake, or sign in to the account that owns this Matter.'},{status:403});
  const admin = createAdminClient();

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      dealId,
    );
  const { data: deal } = await admin
    .from("deals")
    .select("id")
    .eq(isUuid ? "id" : "deal_id", dealId)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const resolvedDealId = deal.id;

  const fileEntries = formData.getAll("files") as File[];
  if (!fileEntries.length) return NextResponse.json({ files: [] });

  const batch = fileEntries.slice(0, MAX_FILES);
  const uploaded: object[] = [];
  const errors: string[] = [];

  for (const file of batch) {
    if (!ALLOWED_TYPES.has(file.type)) {
      errors.push(`${file.name}: unsupported type`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: exceeds 20 MB limit`);
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const storagePath = `${resolvedDealId}/${crypto.randomUUID()}.${ext}`;

    const bytes = await file.arrayBuffer();
    // Structural preflight inspects the bytes read-only; the stored original is
    // exactly what was uploaded.
    const preflight = await inspectDocumentPreflight({
      bytes: new Uint8Array(bytes),
      mimeType: file.type,
      fileName: file.name,
    });
    const { error: uploadErr } = await admin.storage
      .from("deal-documents")
      .upload(storagePath, bytes, { contentType: file.type });

    if (uploadErr) {
      errors.push(`${file.name}: storage upload failed`);
      continue;
    }

    const { data: row, error: recordError } = await admin
      .from("files")
      .insert({
        deal_id: resolvedDealId,
        name: file.name,
        filename: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_type: file.type,
        size_bytes: file.size,
        file_size: file.size,
        category: "client-upload",
        uploaded_by: "client",
        ...preflightColumns(preflight),
      })
      .select()
      .single();

    // Stored bytes without a record are not a confirmed attachment: say so instead of returning an empty success.
    if (recordError || !row) { errors.push(`${file.name}: the attachment was not confirmed`); continue; }
    if(row){try{await persistUploadedVersion(admin,{matterId:resolvedDealId,path:storagePath,bucket:'deal-documents',bytes:new Uint8Array(bytes),mime:file.type,name:file.name,actor:'signed_intake_or_owned_upload',documentId:String(row.id)});uploaded.push(row);}catch{errors.push(file.name+': version evidence was not recorded; contact your coordinator before retrying.');}}
  }

  return NextResponse.json({files:uploaded,errors,owner:errors.length?'MILANO':undefined,next_action:errors.length?'Your request was received, but this attachment was not confirmed. Retry the attachment in this browser or use your secure portal. Do not submit a second request.':undefined},{status:errors.length&&!uploaded.length?503:200});
}
