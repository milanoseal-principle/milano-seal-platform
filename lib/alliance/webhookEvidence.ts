import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SKEW_SECONDS = 300;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AllianceWebhookType = "job" | "toolbelt" | "credential";

function safeEqualHex(expectedHex: string, supplied: string): boolean {
  const normalized = supplied.startsWith("sha256=") ? supplied.slice(7) : supplied;
  if (!/^[0-9a-f]{64}$/i.test(normalized)) return false;
  const a = Buffer.from(expectedHex, "hex");
  const b = Buffer.from(normalized, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function recordAllianceWebhookEvent(
  req: NextRequest,
  eventType: AllianceWebhookType,
): Promise<NextResponse> {
  const secret = process.env.ALLIANCE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "ALLIANCE_WEBHOOK_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const timestamp = String(req.headers.get("x-milano-alliance-timestamp") ?? "").trim();
  const eventKey = String(req.headers.get("x-milano-alliance-event-id") ?? "").trim();
  const signature = String(req.headers.get("x-milano-alliance-signature") ?? "").trim();
  const seconds = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);

  if (!eventKey || eventKey.length > 180 || !Number.isFinite(seconds) || Math.abs(now - seconds) > MAX_SKEW_SECONDS) {
    return NextResponse.json({ error: "INVALID_WEBHOOK_ENVELOPE" }, { status: 401 });
  }

  const rawBody = await req.text();
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  if (!safeEqualHex(expected, signature)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid payload");
    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const matterRef = typeof payload.matter_id === "string" ? payload.matter_id.trim() : "";
  const partnerRef = typeof payload.partner_id === "string" ? payload.partner_id.trim() : "";
  const admin = createAdminClient();

  let matterId: string | null = null;
  if (matterRef) {
    const base = admin.from("deals").select("id,deal_id");
    const { data: matter } = UUID_RE.test(matterRef)
      ? await base.or(`id.eq.${matterRef},deal_id.eq.${matterRef}`).maybeSingle()
      : await base.eq("deal_id", matterRef).maybeSingle();
    if (!matter) {
      return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 422 });
    }
    matterId = matter.id;
  }

  if (partnerRef && !UUID_RE.test(partnerRef)) {
    return NextResponse.json({ error: "INVALID_PARTNER_ID" }, { status: 422 });
  }

  const { data: existing } = await admin
    .from("alliance_webhook_events")
    .select("id,event_type,status,received_at")
    .eq("event_key", eventKey)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ observed: true, idempotent: true, event: existing });
  }

  const { data, error } = await admin
    .from("alliance_webhook_events")
    .insert({
      event_type: eventType,
      event_key: eventKey,
      matter_id: matterId,
      partner_id: partnerRef || null,
      signature_version: "v1",
      status: "OBSERVED",
      payload,
    })
    .select("id,event_type,status,received_at,matter_id,partner_id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "WEBHOOK_EVIDENCE_PERSISTENCE_FAILED" }, { status: 500 });
  }

  // Webhooks append evidence only. They never author Matter lifecycle, payment,
  // execution, RON, apostille, custody or release state.
  if (matterId) {
    await admin.from("matter_events").insert({
      matter_id: matterId,
      event_type: `ALLIANCE_${eventType.toUpperCase()}_OBSERVED`,
      actor: partnerRef || "alliance_webhook",
      client_visible: false,
      metadata: {
        alliance_webhook_event_id: data.id,
        event_key: eventKey,
        evidence_only: true,
      },
    });
  }

  return NextResponse.json({ observed: true, idempotent: false, event: data }, { status: 202 });
}
