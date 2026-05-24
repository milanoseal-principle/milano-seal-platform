import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const { error: uploadErr } = await admin.storage
      .from("deal-documents")
      .upload(storagePath, bytes, { contentType: file.type });

    if (uploadErr) {
      errors.push(`${file.name}: storage upload failed`);
      continue;
    }

    const { data: row } = await admin
      .from("files")
      .insert({
        deal_id: resolvedDealId,
        name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        category: "client-upload",
        uploaded_by: "client",
      })
      .select()
      .single();

    if (row) uploaded.push(row);
  }

  return NextResponse.json({ files: uploaded, errors });
}
