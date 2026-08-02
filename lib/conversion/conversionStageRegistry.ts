import type { ConversionStage } from "./types";

export const conversionStages: { stage: ConversionStage; label: string; operatorAction: string }[] = [
  { stage: "intake_started", label: "Intake started", operatorAction: "Watch for completion or abandonment" },
  { stage: "intake_abandoned", label: "Intake abandoned", operatorAction: "Send gentle recovery follow-up" },
  { stage: "intake_completed", label: "Intake completed", operatorAction: "Begin operator review" },
  { stage: "under_review", label: "Under review", operatorAction: "Confirm pathway and missing facts" },
  { stage: "quote_ready", label: "Quote ready", operatorAction: "Send quote with payment-before-scheduling reminder" },
  { stage: "quote_sent", label: "Quote sent", operatorAction: "Monitor aging clock" },
  { stage: "awaiting_payment", label: "Awaiting payment", operatorAction: "Keep scheduling locked until payment is confirmed" },
  { stage: "payment_confirmed", label: "Payment confirmed", operatorAction: "Unlock scheduling workflow" },
  { stage: "scheduling_unlocked", label: "Scheduling unlocked", operatorAction: "Coordinate execution window" },
  { stage: "stale_quote", label: "Stale quote", operatorAction: "Archive unless founder extends" },
  { stage: "lost", label: "Lost", operatorAction: "Capture reason and stop automated follow-up" },
  { stage: "revived", label: "Revived", operatorAction: "Re-price before collecting payment" },
  { stage: "completed", label: "Completed", operatorAction: "Send completion review to knowledge loop" },
];
