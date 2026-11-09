import { createHash, createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPricingRequestAlerts } from "@/lib/notifications/transactionalEmailAlerts";
import { normalizeConciergeOriginatingPage } from "@/lib/acquisition/concierge-context";
import { CONCIERGE_SERVICE_INTENTS } from "@/lib/acquisition/concierge-service-intents";

// A "Get Pricing" request is a low-friction, persisted conversion that routes
// to Milano review. It reuses the existing canonical sales_leads persistence
// and the proven concierge idempotency contract rather than introducing a new
// lead/CRM or Matter model. A pricing request is NEVER a canonical Matter, a
// payment, a scheduling unlock, or an authoritative route/tier/price: it only
// records a reviewable lead. Milano review (and, where appropriate, the
// explicit lead -> Matter transition) establishes those downstream.

const MAX_BODY_BYTES = 16 * 1024;
const MAX_IP_REQUESTS_PER_HOUR = 10;

export const pricingRequestSchema = z.object({
  request_id: z.string().uuid(),
  full_name: z.string().trim().min(2, "Enter your name.").max(160),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(40).default(""),
  audience: z.enum(["individual", "professional"]),
  // The visitor must not need to know their execution route to request pricing:
  // "unsure" (review my document) is a first-class, valid choice.
  service_intent: z.enum(CONCIERGE_SERVICE_INTENTS),
  execution_preference: z.enum(["ron", "in_person", "mobile", "review_required"]).default("review_required"),
  document_type: z.string().trim().max(200).default(""),
  document_origin: z.string().trim().max(200).default(""),
  signer_location: z.string().trim().max(200).default(""),
  destination: z.string().trim().max(100).default(""),
  deadline: z.string().trim().max(120).default(""),
  urgency: z.enum(["routine", "urgent", "time_sensitive"]),
  execution_status: z.string().trim().max(200).default(""),
  apostille_known: z.enum(["yes", "no", "unsure", ""]).default(""),
  delivery_preference: z.string().trim().max(200).default(""),
  description: z.string().trim().min(10, "Please add a little more context.").max(2000),
  originating_page: z.string().trim().max(500).default(""),
  attribution: z.record(z.string(),z.string().max(500)).default({}),
  website: z.string().max(200).default(""),
});

type PricingRequest = z.infer<typeof pricingRequestSchema>;

type Dependencies = {
  admin: () => SupabaseClient;
  notify: (reference: string) => Promise<string>;
  hashIp: (headers: Headers) => string;
};

function hashClientIp(headers: Headers) {
  const address = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headers.get("x-real-ip")
    || "unknown";
  const secret = process.env.CONCIERGE_ABUSE_HMAC_SECRET
    || process.env.CRON_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("PRICING_GUARD_SECRET_UNAVAILABLE");
  return createHmac("sha256", secret).update(address).digest("hex");
}

// The fingerprint excludes the idempotency key and the honeypot: an identical
// resubmission is a safe retry, while changed facts under the same request_id
// are rejected so one lead is never silently overwritten with different truth.
function fingerprint(request: PricingRequest) {
  const { request_id: _requestId, website: _website, ...facts } = request;
  return createHash("sha256").update(JSON.stringify(facts)).digest("hex");
}

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function receivePricingRequest(
  request: Request,
  dependencies: Dependencies = {
    admin: createAdminClient,
    notify: sendPricingRequestAlerts,
    hashIp: hashClientIp,
  },
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return fail("Please submit from the Milano website.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail("The request is too large.", 413);

  let raw: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) return fail("The request is too large.", 413);
    raw = JSON.parse(text || "{}");
  } catch {
    return fail("Please check the request and try again.", 400);
  }

  const parsed = pricingRequestSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.", 400);
  const pricing = {
    ...parsed.data,
    originating_page: normalizeConciergeOriginatingPage(parsed.data.originating_page),
  };
  if (pricing.website) return fail("Unable to submit this request.", 400);
  const requestFingerprint = fingerprint(pricing);

  let ipHash: string;
  try {
    ipHash = dependencies.hashIp(request.headers);
  } catch {
    return fail("Request protection is temporarily unavailable. Please try again.", 503);
  }

  try {
    const admin = dependencies.admin();
    const { data: existing, error: lookupError } = await admin
      .from("sales_leads")
      .select("id,details")
      .eq("id", pricing.request_id)
      .maybeSingle();
    if (lookupError) return fail("We could not receive your request. Please try again.", 503);
    if (existing && existing.details?.fingerprint !== requestFingerprint) {
      return fail("This request changed. Please start a fresh submission.", 409);
    }

    if (!existing) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: rateError } = await admin
        .from("sales_leads")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", since);
      if (rateError) return fail("We could not receive your request. Please try again.", 503);
      if ((count ?? 0) >= MAX_IP_REQUESTS_PER_HOUR) return fail("Please wait before sending another request.", 429);

      const { error: insertError } = await admin.from("sales_leads").insert({
        id: pricing.request_id,
        full_name: pricing.full_name,
        email: pricing.email.toLowerCase(),
        phone: pricing.phone || null,
        audience: pricing.audience,
        country: pricing.destination || null,
        document_type: pricing.document_type || null,
        product_interest: pricing.service_intent,
        urgency: pricing.urgency,
        source_route: pricing.originating_page || "/pricing",
        desired_next_step: "pricing_request",
        lead_type: "pricing_request",
        ip_hash: ipHash,
        // canonical_matter_id is intentionally left unset: a pricing request is
        // not a Matter. The explicit operator transition links one later.
        details: { ...pricing, fingerprint: requestFingerprint },
      });
      if (insertError) {
        // 23505 is a concurrent duplicate of the same request_id: treat it as a
        // safe retry when the fingerprint matches, never a second lead.
        if (insertError.code !== "23505") return fail("We could not receive your request. Please try again.", 503);
        const { data: raced, error: raceError } = await admin
          .from("sales_leads")
          .select("id,details")
          .eq("id", pricing.request_id)
          .maybeSingle();
        if (raceError || !raced || raced.details?.fingerprint !== requestFingerprint) {
          return fail("This request is already being processed. Please retry shortly.", 409);
        }
      }
    }

    // Notification is evidence-backed and never fabricated; a failure here must
    // not erase the persisted request.
    let notification = "unavailable";
    try {
      notification = await dependencies.notify(pricing.request_id);
    } catch {
      notification = "unavailable";
    }
    return NextResponse.json({
      ok: true,
      reference: pricing.request_id,
      notification,
      duplicate: Boolean(existing),
    }, { status: existing ? 200 : 201 });
  } catch {
    return fail("We could not receive your request. Please try again.", 503);
  }
}
