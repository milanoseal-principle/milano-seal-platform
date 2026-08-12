export type AllianceMemberTypeId = "document_execution" | "international_document" | "legal" | "healthcare" | "government" | "logistics" | "enterprise";
export type AllianceLevel = "ready" | "verified" | "professional" | "specialist" | "executive";

export interface AllianceMemberType {
  id: AllianceMemberTypeId;
  label: string;
  examples: string[];
  value: string;
}

export interface AlliancePipelineStep {
  order: number;
  label: string;
  required: boolean;
  description: string;
}

export interface AllianceScoreCategory {
  id: string;
  label: string;
  weight: number;
  description: string;
}

export interface AlliancePassportField {
  label: string;
  source: "self_attested" | "verified" | "system" | "admin";
  publicVisible: boolean;
}

export interface DispatchStage {
  order: number;
  label: string;
  owner: "system" | "operator" | "executive";
  output: string;
}

export interface TrustLedgerEvent {
  type: string;
  description: string;
  immutable: boolean;
  improvesScore?: boolean;
}
