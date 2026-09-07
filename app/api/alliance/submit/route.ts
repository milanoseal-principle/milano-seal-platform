import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BODY_BYTES = 16_384;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    }
    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    }
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    if (String(body.website ?? "").trim()) {
      return NextResponse.json({ success: true, message: "Observation received." });
    }
    const partner_name = String(body.partner_name ?? "").trim().slice(0, 120);
    const firm = String(body.firm ?? "").trim().slice(0, 160) || null;
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 254);
    const role = String(body.role ?? "").trim().slice(0, 120) || null;
    const observation = String(body.observation ?? "").trim().slice(0, 4000);
    const source_url = String(body.source_url ?? "").trim().slice(0, 500) || null;
    const corridors = Array.isArray(body.corridors)
      ? body.corridors.slice(0, 20).map((value) => String(value).slice(0, 80))
      : [];

    if (!partner_name || !EMAIL_RE.test(email) || !observation) {
      return NextResponse.json(
        { error: "partner_name, email, and observation are required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const forwardedFor =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipHash = createHash("sha256")
      .update(`alliance:${forwardedFor}`)
      .digest("hex");
    const fingerprint = createHash("sha256")
      .update(`${email}:${partner_name.toLowerCase()}:${observation.toLowerCase()}`)
      .digest("hex");
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin
      .from("alliance_observations")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (countError) throw new Error("Alliance abuse check failed");
    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
    }

    const { data, error } = await admin
      .from("alliance_observations")
      .upsert(
        {
          partner_name,
          firm,
          email,
          role,
          corridors,
          observation,
          source_url,
          ip_hash: ipHash,
          request_fingerprint: fingerprint,
        },
        { onConflict: "request_fingerprint", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();
    if (error) throw new Error("Alliance observation persistence failed");
    let persistedId = data?.id ?? null;
    if (!persistedId) {
      const { data: duplicate, error: duplicateError } = await admin
        .from("alliance_observations")
        .select("id")
        .eq("request_fingerprint", fingerprint)
        .single();
      if (duplicateError || !duplicate) {
        throw new Error("Alliance duplicate lookup failed");
      }
      persistedId = duplicate.id;
    }

    return NextResponse.json({
      success: true,
      message:
        "Observation received. The Milano Seal team will review and follow up.",
      reference: persistedId,
    });
  } catch {
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
