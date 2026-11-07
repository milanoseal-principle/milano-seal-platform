import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

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

async function record(input: {
  matterId: string;
  matterReference: string;
  recipient: string;
  type: string;
  subject: string;
  status: "sent" | "failed";
  providerMessageId?: string | null;
  errorMessage?: string | null;
}) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    deal_id: input.matterId,
    recipient_email: input.recipient,
    channel: "email",
    type: input.type,
    subject: input.subject,
    message: `${input.type} for ${input.matterReference}`,
    status: input.status,
    provider: "resend",
    provider_message_id: input.providerMessageId ?? null,
    error_message: input.errorMessage ?? null,
    delivery_status: input.status === "sent" ? "provider_accepted" : "failed",
    delivery_attempts: 1,
    sent_at: input.status === "sent" ? new Date().toISOString() : null,
    failed_at: input.status === "failed" ? new Date().toISOString() : null,
    last_provider_event_at: new Date().toISOString(),
    metadata: {
      matter_reference: input.matterReference,
      evidence_scope: "provider_acceptance_only",
      final_delivery_proven: false,
    },
  });
}

async function sendOne(input: {
  matterId: string;
  matterReference: string;
  recipient: string;
  type: string;
  subject: string;
  html: string;
}) {
  const recipient = input.recipient.trim().toLowerCase();
  if (!recipient || (await alreadySent(input.matterId, recipient, input.type))) return;

  if (!process.env.RESEND_API_KEY) {
    await record({
      ...input,
      recipient,
      status: "failed",
      errorMessage: "RESEND_API_KEY_MISSING",
    });
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
      await record({
        ...input,
        recipient,
        status: "failed",
        errorMessage: result.error.message ?? "Resend rejected email request",
      });
      return;
    }
    await record({
      ...input,
      recipient,
      status: "sent",
      providerMessageId: result.data?.id ?? null,
    });
  } catch (error) {
    await record({
      ...input,
      recipient,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
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
      const message = `Counsel inquiry ${reference}. Review in the operator inbox: /dashboard/marketing/counsel. Name: ${lead.full_name}. Firm: ${String(lead.details?.firm ?? "Not provided").slice(0, 240)}. Country: ${lead.country}. Email: ${lead.email}. Destination: ${String(lead.details?.destination ?? "Not provided").slice(0, 100)}. Source: ${String(lead.details?.attribution?.utm_source ?? lead.details?.attribution?.source ?? "Not provided").slice(0, 100)}. Document: ${lead.details?.document_status ?? "not_provided"}. Review the summary and document in the authenticated inbox. No Matter has been authorized.`;
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
