import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

const FROM = process.env.RESEND_FROM ?? 'The Milano Seal™ <hello@themilanoseal.com>';
const OPERATOR_EMAILS = Array.from(new Set([
  'nicholas@themilanoseal.com',
  'themilanoseal@gmail.com',
  ...(process.env.OPERATOR_NOTIFICATION_EMAILS ?? '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean),
]));

async function sendAndRecord(input: { reviewId: string; matterId?: string | null; recipient: string; type: string; subject: string; body: string }) {
  const admin = createAdminClient();
  const recipient = input.recipient.trim().toLowerCase();
  if (!recipient) return;
  const { data: prior } = await admin.from('notifications').select('id').eq('recipient_email', recipient).eq('type', input.type).contains('metadata', { review_request_id: input.reviewId }).limit(1);
  if (prior?.length) return;

  if (!process.env.RESEND_API_KEY) {
    await admin.from('notifications').insert({
      deal_id: input.matterId ?? null,
      recipient_email: recipient,
      channel: 'email',
      type: input.type,
      subject: input.subject,
      message: input.body,
      status: 'failed',
      provider: 'resend',
      error_message: 'RESEND_API_KEY_MISSING',
      metadata: { review_request_id: input.reviewId, evidence_scope: 'provider_acceptance_only' },
      delivery_attempts: 1,
      failed_at: new Date().toISOString(),
    });
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({ from: FROM, to: recipient, subject: input.subject, html: `<div style="font-family:Arial,sans-serif"><p>${input.body}</p></div>` });
    await admin.from('notifications').insert({
      deal_id: input.matterId ?? null,
      recipient_email: recipient,
      channel: 'email',
      type: input.type,
      subject: input.subject,
      message: input.body,
      status: result.error ? 'failed' : 'sent',
      provider: 'resend',
      provider_message_id: result.data?.id ?? null,
      error_message: result.error?.message ?? null,
      delivery_status: result.error ? 'failed' : 'provider_accepted',
      delivery_attempts: 1,
      sent_at: result.error ? null : new Date().toISOString(),
      failed_at: result.error ? new Date().toISOString() : null,
      last_provider_event_at: new Date().toISOString(),
      metadata: { review_request_id: input.reviewId, evidence_scope: 'provider_acceptance_only', final_delivery_proven: false },
    });
  } catch (error) {
    await admin.from('notifications').insert({
      deal_id: input.matterId ?? null,
      recipient_email: recipient,
      channel: 'email',
      type: input.type,
      subject: input.subject,
      message: input.body,
      status: 'failed',
      provider: 'resend',
      error_message: error instanceof Error ? error.message.slice(0, 500) : 'REVIEW_NOTIFICATION_FAILED',
      delivery_attempts: 1,
      failed_at: new Date().toISOString(),
      metadata: { review_request_id: input.reviewId, evidence_scope: 'provider_acceptance_only' },
    });
  }
}

export async function sendReviewRequestedNotification(input: { reviewId: string; matterId?: string | null; country?: string | null; documentType?: string | null }) {
  const subject = `Milano Review Requested — ${input.reviewId.slice(0, 8)}`;
  const body = `MILANO REVIEW REQUESTED. Country: ${input.country || 'Review required'}. Document: ${input.documentType || 'Review required'}. No execution or payment status has changed.`;
  await Promise.all(OPERATOR_EMAILS.map((recipient) => sendAndRecord({ ...input, recipient, type: 'operator_review_requested', subject, body })));
}

export async function sendReviewResolvedNotification(input: { reviewId: string; matterId: string; clientEmail: string }) {
  await sendAndRecord({
    ...input,
    recipient: input.clientEmail,
    type: 'client_review_resolved',
    subject: 'Milano Review Completed',
    body: 'MILANO REVIEW COMPLETED. Sign in to your secure Matter portal to review the persisted operator response. This notice does not authorize execution or change payment status.',
  });
}
