import type { ExecutionPath } from "@/lib/platform/canonicalMatter";

export interface ExecutionPathwayInputs {
  jurisdiction?: string;
  country?: string;
  documentType?: string;
  signerLocation?: string;
  identityRequirements?: string[];
  witnessRequirements?: string[];
  timeline?: string;
  translationRequired?: boolean;
  governmentRequirements?: string[];
  clientPreferences?: string[];
  fieldAvailability?: "Available" | "Limited" | "Unavailable" | "Unverified";
}

export interface ExecutionPathwayRecommendation {
  recommendedPath: ExecutionPath;
  rationale: string[];
  operatorNextAction: string;
  safetyBoundary: string;
}

export function recommendExecutionPathway(inputs: ExecutionPathwayInputs): ExecutionPathwayRecommendation {
  const requiresField = (inputs.witnessRequirements?.length ?? 0) > 0 || inputs.clientPreferences?.includes("field") || inputs.fieldAvailability === "Available";
  const requiresInternationalCoordination = Boolean(inputs.country && inputs.country !== "United States") || Boolean(inputs.translationRequired) || (inputs.governmentRequirements?.length ?? 0) > 0;
  const recommendedPath: ExecutionPath = requiresInternationalCoordination ? "International Coordination" : requiresField ? "Hybrid Execution" : "Digital First";

  return {
    recommendedPath,
    rationale: [
      inputs.jurisdiction ? `Jurisdiction reviewed: ${inputs.jurisdiction}` : "Jurisdiction must be confirmed before execution.",
      inputs.documentType ? `Document type reviewed: ${inputs.documentType}` : "Document type must be classified before quote lock.",
      requiresField ? "Field execution may be considered based on availability and requirements." : "Digital-first coordination remains the default unless requirements indicate otherwise.",
    ],
    operatorNextAction: "Verify source requirements, availability, and receiving authority constraints before locking the execution pathway.",
    safetyBoundary: "This recommendation is operational routing support only, not legal advice or guaranteed acceptance.",
  };
}
