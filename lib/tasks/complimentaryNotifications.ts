export interface ComplimentaryNotificationDraft {
  audience: "assigned_operator" | "founder" | "client";
  subject: string;
  body: string;
  sendAutomatically: false;
}

export function buildComplimentaryNotificationDrafts(params: {
  originalValue: number;
  reasonLabel: string;
  authorizedByDisplayName: string;
}): ComplimentaryNotificationDraft[] {
  return [
    {
      audience: "assigned_operator",
      subject: "Complimentary Matter authorized",
      body: "Payment is not required. Continue only after all remaining scheduling requirements pass.",
      sendAutomatically: false,
    },
    {
      audience: "founder",
      subject: "Complimentary Authorization recorded",
      body: `Complimentary Matter authorized by ${params.authorizedByDisplayName}. Original value: $${params.originalValue.toFixed(2)}. Reason: ${params.reasonLabel}.`,
      sendAutomatically: false,
    },
    {
      audience: "client",
      subject: "No payment is due for this Matter",
      body: "No payment is due for this Matter. We will contact you regarding the next required step.",
      sendAutomatically: false,
    },
  ];
}
