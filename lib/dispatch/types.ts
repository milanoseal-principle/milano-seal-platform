export type DispatchStatus = "application" | "verification" | "available" | "assigned" | "complete" | "qa_review" | "founder_approval";
export interface DispatchPartner { id: string; name: string; status: DispatchStatus; trustScore: number; coverage: string[]; nextAction: string; }
