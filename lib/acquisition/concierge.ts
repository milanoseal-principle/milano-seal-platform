import { createHash, createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendConciergeInquiryAlerts } from "@/lib/notifications/transactionalEmailAlerts";
import { normalizeConciergeOriginatingPage } from "@/lib/acquisition/concierge-context";
import { CONCIERGE_SERVICE_INTENTS } from "@/lib/acquisition/concierge-service-intents";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_IP_REQUESTS_PER_HOUR = 10;

export const conciergeInquirySchema = z.object({
  request_id: z.string().uuid(),
  full_name: z.string().trim().min(2, "Enter your name.").max(160),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(40).default(""),
  audience: z.enum(["individual", "professional"]),
  service_intent: z.enum(CONCIERGE_SERVICE_INTENTS),
  destination: z.string().trim().max(100).default(""),
  urgency: z.enum(["routine", "urgent", "time_sensitive"]),
  question: z.string().trim().min(10, "Please add a little more context.").max(1500),
  originating_page: z.string().trim().max(500).default(""),
  attribution: z.record(z.string(),z.string().max(500)).default({}),
  website: z.string().max(200).default(""),
});

type ConciergeInquiry = z.infer<typeof conciergeInquirySchema>;

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
  if (!secret) throw new Error("CONCIERGE_GUARD_SECRET_UNAVAILABLE");
  return createHmac("sha256", secret).update(address).digest("hex");
}

function fingerprint(inquiry: ConciergeInquiry) {
  const { request_id: _requestId, website: _website, ...facts } = inquiry;
  return createHash("sha256").update(JSON.stringify(facts)).digest("hex");
}

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function receiveConciergeInquiry(
  request: Request,
  dependencies: Dependencies = {
    admin: createAdminClient,
    notify: sendConciergeInquiryAlerts,
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

  const parsed = conciergeInquirySchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.", 400);
  const inquiry = {
    ...parsed.data,
    originating_page: normalizeConciergeOriginatingPage(parsed.data.originating_page),
  };
  if (inquiry.website) return fail("Unable to submit this request.", 400);
  const requestFingerprint = fingerprint(inquiry);

  let ipHash: string;
  try {
    ipHash = dependencies.hashIp(request.headers);
  } catch {
    return fail("Inquiry protection is temporarily unavailable. Please try again.", 503);
  }

  try {
    const admin = dependencies.admin();
    const { data: existing, error: lookupError } = await admin
      .from("sales_leads")
      .select("id,details")
      .eq("id", inquiry.request_id)
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
        id: inquiry.request_id,
        full_name: inquiry.full_name,
        email: inquiry.email.toLowerCase(),
        phone: inquiry.phone || null,
        audience: inquiry.audience,
        country: inquiry.destination || null,
        product_interest: inquiry.service_intent,
        urgency: inquiry.urgency,
        source_route: inquiry.originating_page || "/speak-with-nicholas",
        desired_next_step: "speak_with_nicholas",
        lead_type: "concierge_inquiry",
        ip_hash: ipHash,
        details: { ...inquiry, fingerprint: requestFingerprint },
      });
      if (insertError) {
        if (insertError.code !== "23505") return fail("We could not receive your request. Please try again.", 503);
        const { data: raced, error: raceError } = await admin
          .from("sales_leads")
          .select("id,details")
          .eq("id", inquiry.request_id)
          .maybeSingle();
        if (raceError || !raced || raced.details?.fingerprint !== requestFingerprint) {
          return fail("This request is already being processed. Please retry shortly.", 409);
        }
      }
    }

    let notification = "unavailable";
    try {
      notification = await dependencies.notify(inquiry.request_id);
    } catch {
      notification = "unavailable";
    }
    return NextResponse.json({
      ok: true,
      reference: inquiry.request_id,
      notification,
      duplicate: Boolean(existing),
    }, { status: existing ? 200 : 201 });
  } catch {
    return fail("We could not receive your request. Please try again.", 503);
  }
}