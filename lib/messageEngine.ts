/**
 * MESSAGE ENGINE — Client-safe communications
 * Approved template registry + approval state tracking.
 * VA can draft. VA can send approved templates only.
 * Legal/procedural templates require admin approval before send.
 */

export type MessageType =
  | "first_response"
  | "missing_info"
  | "document_received"
  | "quote_ready"
  | "payment_reminder"
  | "scheduling_unlocked"
  | "apostille_update"
  | "courier_release"
  | "completion"
  | "review_request"
  | "future_matter_followup";

export type MessageChannel = "email" | "whatsapp" | "portal";

export type MessageState =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "failed"
  | "cancelled";

export interface MessageTemplate {
  type: MessageType;
  subject?: string;
  body: string;
  requires_approval: boolean;
  channels: MessageChannel[];
}

export const MESSAGE_TEMPLATES: Record<MessageType, MessageTemplate> = {
  first_response: {
    type: "first_response",
    subject: "[The Milano Seal] Matter Received — {{matter_id}}",
    body: `Thank you for reaching out to The Milano Seal.

I can help structure the U.S. execution side of this matter. To route this correctly, please send:

1. Destination country
2. Document type
3. Number of signers
4. Deadline, if any
5. Whether apostille or international delivery is needed

Once those details are captured, Nicholas can confirm the proper execution and apostille path.`,
    requires_approval: false,
    channels: ["email", "whatsapp", "portal"],
  },

  missing_info: {
    type: "missing_info",
    subject: "ACTION REQUIRED — Additional Information Needed — {{matter_id}}",
    body: `To move this forward, we still need the following:

{{missing_items}}

Once confirmed, the matter can be routed for review. Nothing will be scheduled until all required information is received and the execution path is confirmed.`,
    requires_approval: false,
    channels: ["email", "whatsapp", "portal"],
  },

  document_received: {
    type: "document_received",
    subject: "Documents Received — {{matter_id}}",
    body: `Your document has been received.

The next step is review for execution readiness, destination-country requirements, apostille routing, and any missing signer details.

Nothing will be scheduled until the execution path and payment status are confirmed.`,
    requires_approval: false,
    channels: ["email", "whatsapp", "portal"],
  },

  quote_ready: {
    type: "quote_ready",
    subject: "Your Execution Proposal is Ready — {{matter_id}}",
    body: `Your execution proposal has been prepared and is ready for review.

Nicholas has confirmed the proper execution path for your matter. Please review the attached proposal and confirm when you are ready to proceed.

Once payment is confirmed, scheduling and execution can move forward.`,
    requires_approval: true,
    channels: ["email", "portal"],
  },

  payment_reminder: {
    type: "payment_reminder",
    subject: "Payment Required to Proceed — {{matter_id}}",
    body: `Your matter is ready to move forward, but scheduling is not unlocked until payment is confirmed.

Once payment is received, the execution step can be scheduled and tracked.

If you have any questions, please reply to this message or contact your coordinator directly.`,
    requires_approval: false,
    channels: ["email", "whatsapp", "portal"],
  },

  scheduling_unlocked: {
    type: "scheduling_unlocked",
    subject: "Payment Confirmed — Scheduling is Now Unlocked — {{matter_id}}",
    body: `Payment has been confirmed. The matter can now move into scheduling and execution.

Your coordinator will follow up shortly with scheduling details.`,
    requires_approval: false,
    channels: ["email", "whatsapp", "portal"],
  },

  apostille_update: {
    type: "apostille_update",
    subject: "Apostille Processing Update — {{matter_id}}",
    body: `Your document has moved into apostille processing.

We will provide a further update once apostille processing is complete and the document is prepared for release.`,
    requires_approval: false,
    channels: ["email", "portal"],
  },

  courier_release: {
    type: "courier_release",
    subject: "Your Document Has Been Released — {{matter_id}}",
    body: `Your apostilled document has been released for courier delivery.

Tracking details are now attached to your matter record. You can monitor delivery status through your client portal.`,
    requires_approval: false,
    channels: ["email", "portal"],
  },

  completion: {
    type: "completion",
    subject: "Matter Completed — {{matter_id}}",
    body: `Your matter has been completed and released. Thank you again for trusting The Milano Seal.

Nicholas remains available whenever your office or client needs U.S. document execution, apostille coordination, or international release support.`,
    requires_approval: true,
    channels: ["email", "portal"],
  },

  review_request: {
    type: "review_request",
    subject: "A Note from The Milano Seal",
    body: `It was a pleasure supporting this matter.

If the process was helpful, a review would mean a great deal and helps future clients know they can trust The Milano Seal for international document execution.`,
    requires_approval: true,
    channels: ["email"],
  },

  future_matter_followup: {
    type: "future_matter_followup",
    subject: "Staying Connected — The Milano Seal",
    body: `It was a pleasure supporting this matter. Nicholas remains available whenever your office or client needs U.S. document execution, apostille coordination, or international release support.

Please do not hesitate to reach out when your next international matter arises.`,
    requires_approval: true,
    channels: ["email"],
  },
};

export function getTemplate(type: MessageType): MessageTemplate {
  return MESSAGE_TEMPLATES[type];
}

export function renderTemplate(
  type: MessageType,
  variables: Record<string, string>,
): { subject: string | undefined; body: string } {
  const template = getTemplate(type);
  let body = template.body;
  let subject = template.subject;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    body = body.replaceAll(placeholder, value);
    if (subject) subject = subject.replaceAll(placeholder, value);
  }

  return { subject, body };
}

export function requiresApproval(type: MessageType): boolean {
  return MESSAGE_TEMPLATES[type]?.requires_approval ?? true;
}

export function isVASendable(type: MessageType): boolean {
  return !requiresApproval(type);
}
