// Notification Orchestration — single, production-safe place that turns a matter
// lifecycle event into a CLIENT-SAFE notification written to the client
// notification log (the `messages` table, direction='outbound', channel='portal').
//
// Hard rules enforced here:
//   - Copy is client-safe: no internal margins, no operator notes, no legal advice.
//   - Receiving-authority boundary language is used where acceptance is involved.
//   - notifyClient() NEVER throws and NEVER blocks: a failed notification must not
//     break payment, release, or any execution flow. Failures are logged + dropped.
//
// Email/WhatsApp are separate transport channels already wired elsewhere; this
// module owns the canonical event→copy mapping and the durable in-portal log entry.

import { createAdminClient } from "@/lib/supabase/admin";
import { queueProfessionalNotification } from "@/lib/professional/notifications";

export type NotificationEvent =
  | "review_started"
  | "execution_started"
  | "authentication_processing"
  | "matter_paused"
  | "intake_received"
  | "quote_ready"
  | "payment_instructions_sent"
  | "payment_observed"
  | "payment_cleared"
  | "scheduling_unlocked"
  | "execution_scheduled"
  | "correction_required"
  | "apostille_submitted"
  | "apostille_completed"
  | "final_payment_due"
  | "release_ready"
  | "shipped"
  | "delivered"
  | "completed";

// Receiving-authority boundary — appended where final acceptance is involved.
const RECEIVING_AUTHORITY_BOUNDARY =
  "Final acceptance is determined by the receiving authority.";

export interface NotificationCopy {
  subject: string;
  body: string;
}

export const NOTIFICATION_COPY: Record<NotificationEvent, NotificationCopy> = {
  review_started:{subject:'Matter review started',body:'Your coordinator is reviewing the information and execution requirements for your Matter.'},
  execution_started:{subject:'Execution in progress',body:'Your Matter has entered execution. Completion requires the separate governed evidence and review controls.'},
  authentication_processing:{subject:'Authentication processing',body:'Your Matter has entered authentication processing. Government submission, receipts and acceptance are recorded separately by your coordinator.'},
  matter_paused:{subject:'Matter paused',body:'Your Matter is paused. Contact your coordinator through the secure portal to review the next permitted step.'},
  intake_received: {
    subject: "Matter received",
    body: "We have received your matter and started controlled intake review. You will be notified as each step is completed.",
  },
  quote_ready: {
    subject: "Proposal issued",
    body: "Your execution proposal is ready in your secure portal. Payment instructions follow once you proceed.",
  },
  payment_instructions_sent: {
    subject: "Payment instructions sent",
    body: "Secure payment instructions are available in your portal. Scheduling unlocks after payment is confirmed.",
  },
  payment_observed: {
    subject: "Payment received — under confirmation",
    body: "Your payment has been observed and is pending confirmation. We will notify you as soon as it is confirmed.",
  },
  payment_cleared: {
    subject: "Payment confirmed",
    body: "Your payment has been confirmed. Your matter now proceeds to scheduling and execution.",
  },
  scheduling_unlocked: {
    subject: "Scheduling unlocked",
    body: "Scheduling is now unlocked for your matter. Your coordinator will confirm execution details.",
  },
  execution_scheduled: {
    subject: "Execution scheduled",
    body: "Your document execution has been scheduled. Details are available in your secure portal.",
  },
  correction_required: {
    subject: "Action needed on your matter",
    body: "A detail on your matter needs your confirmation before we can proceed. Please review the request in your portal.",
  },
  apostille_submitted: {
    subject: "Apostille / authentication submitted",
    body: `Your document has been submitted for apostille or authentication. Processing time depends on the issuing authority. ${RECEIVING_AUTHORITY_BOUNDARY}`,
  },
  apostille_completed: {
    subject: "Apostille / authentication received",
    body: `The apostille or authentication has been completed and received. ${RECEIVING_AUTHORITY_BOUNDARY}`,
  },
  final_payment_due: {
    subject: "Final payment due",
    body: "Your final balance is due before secure international release. Payment instructions are in your portal.",
  },
  release_ready: {
    subject: "Preparing secure release",
    body: `Your matter has cleared its release controls and is being prepared for secure release. ${RECEIVING_AUTHORITY_BOUNDARY}`,
  },
  shipped: {
    subject: "Your documents are in transit",
    body: "Your documents have shipped. Tracking is available in your secure portal.",
  },
  delivered: {
    subject: "Delivered",
    body: `Your documents have been delivered. ${RECEIVING_AUTHORITY_BOUNDARY}`,
  },
  completed: {
    subject: "Matter complete",
    body: `Your matter is complete. Your certificate of custody and final records are available in your portal. ${RECEIVING_AUTHORITY_BOUNDARY}`,
  },
};

export interface NotifyResult {
  ok: boolean;
  skipped?: boolean;
}

/**
 * Write a client-safe notification to the client notification log. Best-effort:
 * never throws, never blocks the caller. Safe to call from payment/release paths.
 */
export async function notifyClient(
  dealId: string,
  event: NotificationEvent,
): Promise<NotifyResult> {
  const copy = NOTIFICATION_COPY[event];
  if (!copy) {
    console.error(`[notify] unknown event "${event}" — skipped`);
    return { ok: false, skipped: true };
  }
  try {
    const admin = createAdminClient();
    const {error}=await admin.rpc('queue_matter_notification',{p_matter:dealId,p_event:event,p_subject:copy.subject,p_body:copy.body,p_state_event:null});
    if (error) {
      console.error(`[notify] log write failed (${event}): ${error.message}`);
      return { ok: false };
    }
    // Referring professional (if any) receives the governed counsel copy.
    await queueProfessionalNotification(admin, dealId, event);
    return { ok: true };
  } catch (err) {
    console.error(
      `[notify] unexpected error (${event}):`,
      err instanceof Error ? err.message : err,
    );
    return { ok: false };
  }
}
