export type AcquisitionStage = "visitor" | "intake" | "quote" | "payment" | "founder_review";
export type AcquisitionAudience = "country" | "attorney" | "university" | "healthcare" | "professional" | "airport_emergency";
export interface AcquisitionSignal { id: string; label: string; stage: AcquisitionStage; audience: AcquisitionAudience; score: number; nextAction: string; safetyNote: string; }
