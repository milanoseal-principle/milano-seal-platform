// Governed notifications to the referring professional.
//
// Every professional message preserves the receiving-authority boundary. A
// queued row records that a notification was created; it is never reported as
// delivered until a provider confirms delivery.

import type { NotificationEvent } from "@/lib/notifications/orchestrator";
import type { NotificationPreference } from "./profile";
import { RECEIVING_AUTHORITY_DISCLAIMER } from "./matterProjection";

export const PROFESSIONAL_NOTIFICATION_COPY: Record<NotificationEvent, { subject: string; body: string }> = {
 review_started:{subject:'Matter review started',body:'The Matter is under controlled review.'},
 execution_started:{subject:'Execution in progress',body:'Execution has started. Governed completion evidence remains separate.'},
 authentication_processing:{subject:'Authentication processing',body:'The Matter has entered authentication processing; authority receipt and acceptance remain separate.'},
 matter_paused:{subject:'Matter paused',body:'The Matter is paused pending coordinator review.'},
  intake_received: { subject: "Matter received", body: "Your client's Matter has been received and is in controlled review." },
  quote_ready: { subject: "Quote issued", body: "A Matter-specific execution quote has been issued to your client." },
  payment_instructions_sent: { subject: "Payment instructions sent", body: "Wise payment instructions have been sent to your client." },
  payment_observed: { subject: "Deposit submitted", body: "Your client's Wise deposit has been observed and is pending confirmation." },
  payment_cleared: { subject: "Deposit confirmed", body: "Your client's deposit is confirmed. Scheduling is now available." },
  scheduling_unlocked: { subject: "Scheduling available", body: "Your client can now schedule the U.S. execution." },
  execution_scheduled: { subject: "Execution scheduled", body: "The U.S. execution for your client's Matter is scheduled." },
  correction_required: { subject: "Information required", body: "The Matter needs additional information or review before it can proceed." },
  apostille_submitted: { subject: "Authentication / apostille submitted", body: "The document has been submitted for authentication / apostille." },
  apostille_completed: { subject: "Authentication / apostille completed", body: "Authentication / apostille has been completed and received." },
  final_payment_due: { subject: "Final payment required", body: "The final balance is due before controlled release." },
  release_ready: { subject: "Ready for release", body: "The Matter has cleared release controls and is being prepared for dispatch." },
  shipped: { subject: "Released to courier", body: "The document has been released to the courier." },
  delivered: { subject: "Delivered", body: "Courier delivery has been recorded." },
  completed: { subject: "Matter completed", body: "The Matter is complete." },
};

const KEY_MILESTONES = new Set<NotificationEvent>([
  "intake_received",
  "quote_ready",
  "payment_cleared",
  "execution_scheduled",
  "correction_required",
  "apostille_completed",
  "shipped",
  "delivered",
  "completed",
]);

export function professionalNotificationAllowed(
  preference: NotificationPreference | string | null | undefined,
  event: NotificationEvent,
): boolean {
  if (preference === "exceptions_only") return event === "correction_required";
  if (preference === "key_milestones") return KEY_MILESTONES.has(event);
  return true;
}

export function professionalNotificationMessage(event: NotificationEvent) {
  const copy = PROFESSIONAL_NOTIFICATION_COPY[event];
  return {
    subject: `The Milano Seal — ${copy.subject}`,
    body: `${copy.body} ${RECEIVING_AUTHORITY_DISCLAIMER}`,
  };
}

type AdminClient = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/** Best-effort; never throws and never blocks the Matter flow. */
export async function queueProfessionalNotification(
  admin: AdminClient,
  dealId: string,
  event: NotificationEvent,
): Promise<{ queued: boolean }> {
  try {
    const { data: deal } = await admin
      .from("deals")
      .select("id,deal_id,professional_profile_id")
      .eq("id", dealId)
      .maybeSingle();
    const profileId = deal?.professional_profile_id as string | null | undefined;
    if (!profileId) return { queued: false };

    const { data: profile } = await admin
      .from("professional_profiles")
      .select("id,email,status,notification_preference")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile || profile.status === "inactive") return { queued: false };
    if (!professionalNotificationAllowed(profile.notification_preference, event)) return { queued: false };

    const message = professionalNotificationMessage(event);
    const { error } = await admin.from("notifications").insert({
      deal_id: dealId,
      recipient_email: profile.email,
      channel: "email",
      type: `professional_${event}`,
      subject: message.subject,
      message: message.body,
      status: "pending",
      metadata: { audience: "professional", professional_profile_id: profileId, matter_reference: deal?.deal_id ?? null },
    });
    return { queued: !error };
  } catch {
    return { queued: false };
  }
}
