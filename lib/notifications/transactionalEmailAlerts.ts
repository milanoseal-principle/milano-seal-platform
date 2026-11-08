import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificationIdempotencyKey } from "@/lib/notifications/deliveryTruth";

const FROM = process.env.RESEND_FROM ?? "The Milano Seal™ <hello@themilanoseal.com>";
const DEFAULT_OPERATOR_EMAILS = [
  "nicholas@themilanoseal.com",
  "themilanoseal@gmail.com",
];

function operatorEmails(): string[] {
  const configured = (process.env.OPERATOR_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_OPERATOR_EMAILS, ...configured]));
}

function money(value: number | null | undefined, currency = "USD") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

async function alreadySent(matterId: string, recipient: string, type: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select("id")
    .eq("deal_id", matterId)
    .eq("recipient_email", recipient)
    .eq("type", type)
    .eq("status", "sent")
    .limit(1);
  return Boolean(data?.length);
}

type NotificationInput = {
  matterId: string;
  matterReference: string;
  recipient: string;
  type: string;
  subject: string;
};

const SETTLED_DELIVERY = new Set(["provider_accepted", "delivered", "bounced", "complained", "suppressed"]);

// Claim one evidence row per (matter, type, recipient) before sending so concurrent retries
// cannot send twice. A failed claim may be retried; an accepted/delivered one never resends.
async function claim(input: NotificationInput): Promise<{ id: string; attempts: number } | null> {
  const admin = createAdminClient();
  const idempotencyKey = notificationIdempotencyKey(input.matterId, input.type, input.recipient);
  const now = new Date().toISOString();
  const { data: created, error } = await admin.from("notifications").insert({
    deal_id: input.matterId,
    recipient_email: input.recipient,
    channel: "email",
    type: input.type,
    template_id: input.type,
    template_version: "1",
    subject: input.subject,
    message: `${input.type} for ${input.matterReference}`,
    status: "pending",
    provider: "resend",
    delivery_status: "pending",
    delivery_attempts: 0,
    idempotency_key: idempotencyKey,
    correlation_id: input.matterId,
    queued_at: now,
    metadata: { matter_reference: input.matterReference, evidence_scope: "provider_acceptance_only", final_delivery_proven: false },
  }).select("id").single();
  if (created) return { id: created.id as string, attempts: 0 };
  if (error?.code !== "23505") return null;
  const { data: existing } = await admin.from("notifications")
    .select("id, status, delivery_status, delivery_attempts")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (!existing || existing.status === "sent" || SETTLED_DELIVERY.has(String(existing.delivery_status))) return null;
  return { id: existing.id as string, attempts: Number(existing.delivery_attempts ?? 0) };
}

async function record(claimed: { id: string; attempts: number }, input: {
  status: "sent" | "failed";
  providerMessageId?: string | null;
  errorMessage?: string | null;
  errorClassification?: string;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin.from("notifications").update({
    status: input.status,
    provider_message_id: input.providerMessageId ?? null,
    error_message: input.errorMessage ?? null,
    error_classification: input.status === "failed" ? input.errorClassification ?? "provider_rejected" : null,
    // Provider acceptance (202) is not delivery; delivered requires the provider webhook.
    delivery_status: input.status === "sent" ? "provider_accepted" : "failed",
    delivery_attempts: claimed.attempts + 1,
    attempted_at: now,
    provider_accepted_at: input.status === "sent" ? now : null,
    sent_at: input.status === "sent" ? now : null,
    failed_at: input.status === "failed" ? now : null,
    last_provider_event_at: now,
  }).eq("id", claimed.id);
}

async function sendOne(input: NotificationInput & { html: string }) {
  const recipient = input.recipient.trim().toLowerCase();
  if (!recipient || (await alreadySent(input.matterId, recipient, input.type))) return;
  const claimed = await claim({ ...input, recipient });
  if (!claimed) return;

  if (!process.env.RESEND_API_KEY) {
    await record(claimed, { status: "failed", errorMessage: "RESEND_API_KEY_MISSING", errorClassification: "configuration" });
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: FROM,
      to: recipient,
      subject: input.subject,
      html: input.html,
    });
    if (result.error) {
      await record(claimed, { status: "failed", errorMessage: result.error.message ?? "Resend rejected email request" });
      return;
    }
    await record(claimed, { status: "sent", providerMessageId: result.data?.id ?? null });
  } catch (error) {
    await record(claimed, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      errorClassification: "transport_error",
    });
  }
}

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#090909;color:#ddd;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:36px 24px"><div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#c6a55a">The Milano Seal™</div><h1 style="font-family:Georgia,serif;color:#fff;font-weight:400">${title}</h1><div style="font-size:14px;line-height:1.7;color:#bbb">${body}</div></div></body></html>`;
}

export async function sendOperatorIntakeAlerts(input: {
  matterId: string;
  matterReference: string;
  clientName?: string | null;
  clientEmail?: string | null;
  documentType?: string | null;
  destination?: string | null;
  finalTotal?: number | null;
  amountDue?: number | null;
  currency?: string | null;
}) {
  const subject = `New Matter Intake — ${input.matterReference}`;
  const html = shell(
    "New Matter received",
    `<p><strong>${input.matterReference}</strong> has entered production intake.</p><p>Client: ${input.clientName || "Not provided"}<br/>Email: ${input.clientEmail || "Not provided"}<br/>Document: ${input.documentType || "Review required"}<br/>Destination: ${input.destination || "Review required"}<br/>Final total: ${money(input.finalTotal, input.currency || "USD")}<br/>Amount due: ${money(input.amountDue, input.currency || "USD")}</p>`,
  );
  await Promise.all(operatorEmails().map((recipient) => sendOne({
    matterId: input.matterId,
    matterReference: input.matterReference,
    recipient,
    type: "operator_intake_alert",
    subject,
    html,
  })));
}

export async function sendPaymentObservedAlerts(input: {
  matterId: string;
  matterReference: string;
  clientName?: string | null;
  clientEmail?: string | null;
  amountDue: number;
  currency?: string | null;
}) {
  const currency = input.currency || "USD";
  const subject = `Wise Payment Processing — ${input.matterReference}`;
  const clientHtml = shell(
    "Wise payment submitted",
    `<p>Your payment of <strong>${money(input.amountDue, currency)}</strong> has been recorded for Matter <strong>${input.matterReference}</strong>.</p><p>Scheduling remains locked until verified Wise settlement. Submission is not payment confirmation.</p><p>This submission is not yet a verified paid/settled state, and any settlement-dependent final release remains protected until Wise settlement is verified.</p>`,
  );
  const operatorHtml = shell(
    "Internal · Wise processing / scheduling locked",
    `<p>Client payment submission of <strong>${money(input.amountDue, currency)}</strong> is recorded for Matter <strong>${input.matterReference}</strong>.</p><p><strong>Scheduling will unlock only after verified settlement.</strong> Do not schedule or begin BlueNotary execution before verified Wise settlement and the remaining execution gates.</p><p>Internal payment state remains <strong>Wise processing / settlement pending</strong>. Do not represent the Matter as paid or settled until canonical Wise verification completes. Settlement-dependent final release remains locked.</p>`,
  );

  const clientRecipient = input.clientEmail?.trim().toLowerCase() || null;
  const operatorRecipients = operatorEmails();
  await Promise.all([
    ...(clientRecipient ? [sendOne({
      matterId: input.matterId,
      matterReference: input.matterReference,
      recipient: clientRecipient,
      type: "client_payment_observed",
      subject,
      html: clientHtml,
    })] : []),
    ...operatorRecipients.map((recipient) => sendOne({
      matterId: input.matterId,
      matterReference: input.matterReference,
      recipient,
      type: "operator_payment_observed",
      subject,
      html: operatorHtml,
    })),
  ]);
}

export async function sendPaymentClearedAlerts(input: {
  matterId: string;
  matterReference: string;
  clientEmail?: string | null;
  amountPaid: number;
  currency?: string | null;
}) {
  const currency = input.currency || "USD";
  const subject = `Wise Payment Confirmed — ${input.matterReference}`;
  const html = shell(
    "Wise payment confirmed",
    `<p>Wise settlement has been verified for Matter <strong>${input.matterReference}</strong>.</p><p>Verified amount: <strong>${money(input.amountPaid, currency)}</strong>.</p><p>Verified settlement establishes paid truth. Scheduling may now proceed once, subject to the remaining execution requirements and canonical transition guards.</p>`,
  );

  const recipients = Array.from(new Set([
    ...(input.clientEmail ? [input.clientEmail.toLowerCase()] : []),
    ...operatorEmails(),
  ]));
  await Promise.all(recipients.map((recipient) => sendOne({
    matterId: input.matterId,
    matterReference: input.matterReference,
    recipient,
    type: recipient === input.clientEmail?.toLowerCase() ? "client_payment_confirmed" : "operator_payment_confirmed",
    subject,
    html,
  })));
}

/** Inquiry receipt is independent of a canonical Matter and never unlocks it. */
export async function sendCounselInquiryAlerts(
  reference: string,
): Promise<string> {
  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("sales_leads")
    .select("id,full_name,email,country,details")
    .eq("id", reference)
    .single();
  if (error || !lead) return "unavailable";
  const results = await Promise.all(
    operatorEmails().map(async (recipient) => {
      const { data: prior } = await admin
        .from("notifications")
        .select("id,status,provider_message_id,delivery_attempts")
        .eq("type", "operator_counsel_inquiry")
        .eq("recipient_email", recipient)
        .contains("metadata", { inquiry_reference: reference })
        .limit(1)
        .maybeSingle();
      if (prior?.status === "sent" && prior.provider_message_id)
        return "provider_accepted";
      const message = `Counsel inquiry ${reference}. Review in the operator inbox: https://www.themilanoseal.com/dashboard/marketing/counsel#inquiry-${reference}. Name: ${lead.full_name}. Firm: ${String(lead.details?.firm ?? "Not provided").slice(0, 240)}. Country: ${lead.country}. Email: ${lead.email}. Destination: ${String(lead.details?.destination ?? "Not provided").slice(0, 100)}. Source: ${String(lead.details?.attribution?.utm_source ?? lead.details?.attribution?.source ?? "Not provided").slice(0, 100)}. Document: ${lead.details?.document_status ?? "not_provided"}. Review the summary and document in the authenticated inbox. No Matter has been authorized.`;
      let notificationId = prior?.id;
      if (!notificationId) {
        const { data, error: queueError } = await admin
          .from("notifications")
          .insert({
            recipient_email: recipient,
            channel: "email",
            type: "operator_counsel_inquiry",
            subject: `Counsel inquiry — ${reference}`,
            message,
            status: "pending",
            metadata: {
              inquiry_reference: reference,
              final_delivery_proven: false,
            },
          })
          .select("id")
          .single();
        if (queueError || !data) return "unavailable";
        notificationId = data.id;
      }
      let providerId: string | null = null;
      let failure: string | null = null;
      try {
        if (!process.env.RESEND_API_KEY) failure = "RESEND_API_KEY_MISSING";
        else {
          const result = await new Resend(
            process.env.RESEND_API_KEY,
          ).emails.send(
            {
              from: FROM,
              to: recipient,
              subject: `Counsel inquiry — ${reference}`,
              text: message,
            },
            { idempotencyKey: `counsel-${reference}-${recipient}` },
          );
          providerId = result.data?.id ?? null;
          failure =
            result.error?.message ??
            (providerId ? null : "PROVIDER_ACCEPTANCE_UNCONFIRMED");
        }
      } catch {
        failure = "PROVIDER_REQUEST_FAILED";
      }
      const { error: recordError } = await admin
        .from("notifications")
        .update({
          status: providerId ? "sent" : "failed",
          provider: "resend",
          provider_message_id: providerId,
          delivery_attempts: (prior?.delivery_attempts ?? 0) + 1,
          delivery_status: providerId ? "provider_accepted" : "failed",
          error_message: failure,
          sent_at: providerId ? new Date().toISOString() : null,
          failed_at: failure ? new Date().toISOString() : null,
          last_provider_event_at: new Date().toISOString(),
        })
        .eq("id", notificationId);
      return recordError
        ? "unavailable"
        : providerId
          ? "provider_accepted"
          : "failed";
    }),
  );
  return results.every((state) => state === "provider_accepted")
    ? "provider_accepted"
    : results.includes("unavailable")
      ? "unavailable"
      : "failed";
}

export async function sendConciergeInquiryAlerts(reference: string): Promise<string> {
  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("sales_leads")
    .select("id,full_name,email,phone,product_interest,country,urgency,source_route,details")
    .eq("id", reference)
    .eq("lead_type", "concierge_inquiry")
    .single();
  if (error || !lead) return "unavailable";

  const states = await Promise.all(operatorEmails().map(async (recipient) => {
    const { data: prior } = await admin
      .from("notifications")
      .select("id,status,provider_message_id,delivery_attempts")
      .eq("type", "operator_concierge_inquiry")
      .eq("recipient_email", recipient)
      .contains("metadata", { concierge_inquiry_id: reference })
      .limit(1)
      .maybeSingle();
    if (prior?.status === "sent" && prior.provider_message_id) return "provider_accepted";

    let notificationId = prior?.id;
    if (!notificationId) {
      const { data, error: queueError } = await admin
        .from("notifications")
        .insert({
          recipient_email: recipient,
          channel: "email",
          type: "operator_concierge_inquiry",
          subject: `Concierge inquiry — ${reference}`,
          message: `New concierge inquiry ${reference}; review it in the authenticated Lead Pipeline. No Matter, quote, payment, or scheduling state was created.`,
          status: "pending",
          delivery_status: "queued",
          delivery_attempts: 0,
          metadata: { concierge_inquiry_id: reference, evidence_scope: "provider_acceptance_only", final_delivery_proven: false },
        })
        .select("id")
        .single();
      if (queueError || !data) return "unavailable";
      notificationId = data.id;
    }

    const attempt = (prior?.delivery_attempts ?? 0) + 1;
    const { error: attemptError } = await admin
      .from("notifications")
      .update({
        status: "pending",
        delivery_status: prior ? "retrying" : "queued",
        delivery_attempts: attempt,
        error_message: null,
        failed_at: null,
        last_provider_event_at: new Date().toISOString(),
      })
      .eq("id", notificationId);
    if (attemptError) return "unavailable";

    let providerId: string | null = null;
    let failure: string | null = null;
    try {
      if (!process.env.RESEND_API_KEY) failure = "RESEND_API_KEY_MISSING";
      else {
        const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
          {
            from: FROM,
            to: recipient,
            subject: `Concierge inquiry — ${reference}`,
            text: `A new concierge inquiry is recorded. Name: ${lead.full_name}. Email: ${lead.email}. Phone: ${lead.phone || "Not provided"}. Service intent: ${lead.product_interest || "Review required"}. Destination: ${lead.country || "Not provided"}. Urgency: ${lead.urgency || "Not provided"}. Origin: ${lead.source_route || "Not provided"}. Review the inquiry in the authenticated Lead Pipeline. The message summary is not included in email. No Matter or operational state was created.`,
          },
          { idempotencyKey: `concierge-${reference}-${recipient}` },
        );
        providerId = result.error ? null : result.data?.id ?? null;
        failure = result.error?.message ?? (providerId ? null : "PROVIDER_ACCEPTANCE_UNCONFIRMED");
      }
    } catch {
      failure = "PROVIDER_REQUEST_FAILED";
    }

    const { error: recordError } = await admin
      .from("notifications")
      .update({
        status: providerId ? "sent" : "failed",
        provider: "resend",
        provider_message_id: providerId,
        delivery_attempts: attempt,
        delivery_status: providerId ? "provider_accepted" : "failed",
        error_message: failure,
        sent_at: providerId ? new Date().toISOString() : null,
        failed_at: failure ? new Date().toISOString() : null,
        last_provider_event_at: new Date().toISOString(),
      })
      .eq("id", notificationId);
    if (recordError) return "unavailable";
    return providerId ? "provider_accepted" : "failed";
  }));

  return states.every((state) => state === "provider_accepted")
    ? "provider_accepted"
    : states.includes("unavailable")
      ? "unavailable"
      : "failed";
}

// Operator alert for a "Get Pricing" request. Evidence is provider-acceptance
// only — never a claim of delivery — and the request's document facts and
// free-text are never placed in the email body; operators review them in the
// authenticated Lead Pipeline. A notification failure never erases the lead.
export async function sendPricingRequestAlerts(reference: string): Promise<string> {
  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("sales_leads")
    .select("id,full_name,email,phone,product_interest,country,urgency,source_route")
    .eq("id", reference)
    .eq("lead_type", "pricing_request")
    .single();
  if (error || !lead) return "unavailable";

  const states = await Promise.all(operatorEmails().map(async (recipient) => {
    const { data: prior } = await admin
      .from("notifications")
      .select("id,status,provider_message_id,delivery_attempts")
      .eq("type", "operator_pricing_request")
      .eq("recipient_email", recipient)
      .contains("metadata", { pricing_request_id: reference })
      .limit(1)
      .maybeSingle();
    if (prior?.status === "sent" && prior.provider_message_id) return "provider_accepted";

    let notificationId = prior?.id;
    if (!notificationId) {
      const { data, error: queueError } = await admin
        .from("notifications")
        .insert({
          recipient_email: recipient,
          channel: "email",
          type: "operator_pricing_request",
          subject: `Pricing request — ${reference}`,
          message: `New pricing request ${reference}; review it in the authenticated Lead Pipeline. No Matter, quote, payment, or scheduling state was created.`,
          status: "pending",
          delivery_status: "queued",
          delivery_attempts: 0,
          metadata: { pricing_request_id: reference, evidence_scope: "provider_acceptance_only", final_delivery_proven: false },
        })
        .select("id")
        .single();
      if (queueError || !data) return "unavailable";
      notificationId = data.id;
    }

    const attempt = (prior?.delivery_attempts ?? 0) + 1;
    const { error: attemptError } = await admin
      .from("notifications")
      .update({
        status: "pending",
        delivery_status: prior ? "retrying" : "queued",
        delivery_attempts: attempt,
        error_message: null,
        failed_at: null,
        last_provider_event_at: new Date().toISOString(),
      })
      .eq("id", notificationId);
    if (attemptError) return "unavailable";

    let providerId: string | null = null;
    let failure: string | null = null;
    try {
      if (!process.env.RESEND_API_KEY) failure = "RESEND_API_KEY_MISSING";
      else {
        const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
          {
            from: FROM,
            to: recipient,
            subject: `Pricing request — ${reference}`,
            text: `A new pricing request is recorded. Name: ${lead.full_name}. Email: ${lead.email}. Phone: ${lead.phone || "Not provided"}. Service intent: ${lead.product_interest || "Review required"}. Destination: ${lead.country || "Not provided"}. Urgency: ${lead.urgency || "Not provided"}. Origin: ${lead.source_route || "Not provided"}. Review the request in the authenticated Lead Pipeline. Document details and description are not included in email. No Matter, quote, payment, or scheduling state was created.`,
          },
          { idempotencyKey: `pricing-${reference}-${recipient}` },
        );
        providerId = result.error ? null : result.data?.id ?? null;
        failure = result.error?.message ?? (providerId ? null : "PROVIDER_ACCEPTANCE_UNCONFIRMED");
      }
    } catch {
      failure = "PROVIDER_REQUEST_FAILED";
    }

    const { error: recordError } = await admin
      .from("notifications")
      .update({
        status: providerId ? "sent" : "failed",
        provider: "resend",
        provider_message_id: providerId,
        delivery_attempts: attempt,
        delivery_status: providerId ? "provider_accepted" : "failed",
        error_message: failure,
        sent_at: providerId ? new Date().toISOString() : null,
        failed_at: failure ? new Date().toISOString() : null,
        last_provider_event_at: new Date().toISOString(),
      })
      .eq("id", notificationId);
    if (recordError) return "unavailable";
    return providerId ? "provider_accepted" : "failed";
  }));

  return states.every((state) => state === "provider_accepted")
    ? "provider_accepted"
    : states.includes("unavailable")
      ? "unavailable"
      : "failed";
}
