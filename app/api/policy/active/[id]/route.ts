import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "INVALID_POLICY_ID" }, { status: 400 });
  const admin = createAdminClient();
  const { data: version, error } = await admin.from("policy_versions")
    .select("id,policy_type,version,content_sha256,content_reference,effective_at")
    .eq("id", id).eq("status", "active").lte("effective_at", new Date().toISOString()).maybeSingle();
  if (error) return NextResponse.json({ code: "POLICY_REGISTRY_UNAVAILABLE" }, { status: 503 });
  if (!version) return NextResponse.json({ code: "POLICY_VERSION_NOT_ACTIVE" }, { status: 404 });
  const path = `policies/${version.policy_type}/${version.version}/${version.content_sha256}.txt`;
  if (version.content_reference !== `storage:documents/${path}`) return NextResponse.json({ code: "POLICY_CONTENT_UNAVAILABLE" }, { status: 409 });
  const object = await admin.storage.from("documents").download(path);
  if (object.error || !object.data || object.data.size > 100000) return NextResponse.json({ code: "POLICY_CONTENT_UNAVAILABLE" }, { status: 503 });
  const bytes = Buffer.from(await object.data.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== version.content_sha256) return NextResponse.json({ code: "POLICY_CONTENT_INTEGRITY_FAILED" }, { status: 409 });
  return NextResponse.json({
    id: version.id, policy_type: version.policy_type, version: version.version,
    content_sha256: version.content_sha256, effective_at: version.effective_at, content: bytes.toString("utf8"),
  }, { headers: { "Cache-Control": "no-store" } });
}
