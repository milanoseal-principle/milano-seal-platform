export type MilanoSealLifecycleStage = "intake_received" | "under_review" | "quoted" | "awaiting_payment" | "payment_confirmed" | "scheduled" | "identity_verification" | "in_execution" | "notarized_or_executed" | "apostille_processing" | "translation_processing" | "shipping_label_created" | "in_transit" | "delivered" | "completed" | "closed_lost" | "referred_out" | "blocked";
export const MILANO_SEAL_EXECUTION_LIFECYCLE: Record<MilanoSealLifecycleStage, { trigger: string; operatorActions: string[]; clientVisibleLabel: string; internalOnly: boolean }> = {
  intake_received: { trigger: "intake submitted", operatorActions: ["review intake"], clientVisibleLabel: "Secure Records Intake received", internalOnly: false },
  under_review: { trigger: "operator opens matter", operatorActions: ["verify path"], clientVisibleLabel: "Under review", internalOnly: false },
  quoted: { trigger: "quote prepared", operatorActions: ["send quote"], clientVisibleLabel: "Quote ready", internalOnly: false },
  awaiting_payment: { trigger: "quote accepted", operatorActions: ["monitor payment"], clientVisibleLabel: "Awaiting payment authorization", internalOnly: false },
  payment_confirmed: { trigger: "payment confirmed", operatorActions: ["unlock scheduling"], clientVisibleLabel: "Payment confirmed", internalOnly: false },
  scheduled: { trigger: "session scheduled", operatorActions: ["confirm identity path"], clientVisibleLabel: "Scheduled", internalOnly: false },
  identity_verification: { trigger: "pre-execution", operatorActions: ["review ID path"], clientVisibleLabel: "Identity verification", internalOnly: false },
  in_execution: { trigger: "execution starts", operatorActions: ["monitor execution"], clientVisibleLabel: "In execution", internalOnly: false },
  notarized_or_executed: { trigger: "execution complete", operatorActions: ["QA executed document"], clientVisibleLabel: "Executed document under review", internalOnly: false },
  apostille_processing: { trigger: "apostille submitted", operatorActions: ["track authority"], clientVisibleLabel: "Apostille processing", internalOnly: false },
  translation_processing: { trigger: "translation started", operatorActions: ["track translation"], clientVisibleLabel: "Translation review", internalOnly: false },
  shipping_label_created: { trigger: "label created", operatorActions: ["custody handoff"], clientVisibleLabel: "Courier label created", internalOnly: false },
  in_transit: { trigger: "courier scan", operatorActions: ["watch exceptions"], clientVisibleLabel: "International Courier Release in transit", internalOnly: false },
  delivered: { trigger: "delivery confirmed", operatorActions: ["confirm delivery"], clientVisibleLabel: "Delivered", internalOnly: false },
  completed: { trigger: "matter complete", operatorActions: ["send review request"], clientVisibleLabel: "Completed", internalOnly: false },
  closed_lost: { trigger: "lost close", operatorActions: ["archive"], clientVisibleLabel: "Closed", internalOnly: true },
  referred_out: { trigger: "outside scope", operatorActions: ["refer out"], clientVisibleLabel: "Referred for outside support", internalOnly: false },
  blocked: { trigger: "critical block", operatorActions: ["founder/admin review"], clientVisibleLabel: "Review required", internalOnly: false },
};
export function getMilanoSealLifecycleStageDefinition(stage: MilanoSealLifecycleStage) { return MILANO_SEAL_EXECUTION_LIFECYCLE[stage]; }
export function getNextMilanoSealLifecycleActions(stage: MilanoSealLifecycleStage) { return MILANO_SEAL_EXECUTION_LIFECYCLE[stage].operatorActions; }
export function getClientVisibleStageLabel(stage: MilanoSealLifecycleStage) { return MILANO_SEAL_EXECUTION_LIFECYCLE[stage].clientVisibleLabel; }
export function isStageClientVisible(stage: MilanoSealLifecycleStage) { return !MILANO_SEAL_EXECUTION_LIFECYCLE[stage].internalOnly; }
