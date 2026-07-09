export type ExecutionLaneId = "signature" | "priority" | "executive";

export interface ExecutionLane {
  id: ExecutionLaneId;
  name: string;
  price: number;
  timeline: string;
  bestFor: string[];
  includes: string[];
  caveats: string[];
}

export interface SmartIntakeFactor {
  id: string;
  label: string;
  purpose: string;
}

export interface JurisdictionRecord {
  country: string;
  pathway: "hague" | "non_hague" | "complex";
  notes: string;
  verifyBeforeQuote: boolean;
}

export interface OpportunitySignal {
  id: string;
  source: string;
  description: string;
  action: string;
}
