import { createAdminClient } from "@/lib/supabase/admin";

const COPY = {
  REQUESTED: ["MILANO REVIEW REQUESTED", "A governed Milano review request is awaiting acknowledgment."],
  ACKNOWLEDGED: ["MILANO REVIEW ACKNOWLEDGED", "Your review request has been acknowledged."],
  IN_PROGRESS: ["MILANO REVIEW IN PROGRESS", "Your review request is under operational review."],
  RESOLVED: ["MILANO REVIEW COMPLETED", "Your operational review has been completed. Review the persisted result in your Matter Control Portal."],
} as const;

export async function queueOperatorReviewNotification(reviewRequestId: string, matterId: string | null) {
  const recipient = process.env.OPERATOR_REVIEW_NOTIFICATION_EMAIL?.trim();
  if (!recipient) return { queued: false, reason: "OPERATOR_REVIEW_NOTIFICATION_EMAIL_UNCONFIGURED" };
  const admin = createAdminClient();
  const [subject, message] = COPY.REQUESTED;
  const { error } = await admin.from("notifications").insert({
    deal_id: matterId,
    recipient_email: recipient,
    channel: "email",
    type: "review_requested",
    subject,
    message,
    status: "pending",
    metadata: { review_request_id: reviewRequestId },
  });
  return { queued: !error, reason: error ? "NOTIFICATION_QUEUE_FAILED" : undefined };
}

export async function queueClientReviewNotification(input: {
  status: keyof typeof COPY;
  reviewRequestId: string;
  matterId: string | null;
  recipientEmail: string | null;
}) {
  if (!input.matterId || !input.recipientEmail || input.status === "REQUESTED") return { queued: false };
  const admin = createAdminClient();
  const [subject, message] = COPY[input.status];
  const { error } = await admin.from("notifications").insert({
    deal_id: input.matterId,
    recipient_email: input.recipientEmail,
    channel: "email",
    type: `review_${input.status.toLowerCase()}`,
    subject,
    message,
    status: "pending",
    metadata: { review_request_id: input.reviewRequestId },
  });
  return { queued: !error };
}
