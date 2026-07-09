export type ConversionStage =
  | "intake_started"
  | "intake_abandoned"
  | "intake_completed"
  | "under_review"
  | "quote_ready"
  | "quote_sent"
  | "awaiting_payment"
  | "payment_confirmed"
  | "scheduling_unlocked"
  | "stale_quote"
  | "lost"
  | "revived"
  | "completed";

export type ConversionMatter = {
  id: string;
  matter: string;
  stage: ConversionStage;
  clientType: "private" | "attorney" | "international" | "airport" | "healthcare";
  quotedValue: number;
  hoursSinceLastAction: number;
  paymentConfirmed: boolean;
  nextAction: string;
  sample: true;
};

export type FollowUpCadence = "24_hours" | "48_hours" | "72_hours" | "7_days";
