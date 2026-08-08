/**
 * High-Value Asset Intelligence — core types. A document-execution and
 * trust-chain-visibility layer that EXTENDS the Maritime vertical. It is not an
 * ownership, customs, title, insurance, shipping, or regulatory-approval service.
 * Unknown values remain null; nothing about ownership/title/clearance is inferred.
 */

export type AssetCategory =
  | "vessel"
  | "aircraft"
  | "exotic-vehicle"
  | "classic-vehicle"
  | "art-collectible"
  | "jewelry-watch"
  | "heavy-equipment"
  | "commercial-asset"
  | "international-asset"
  | "unknown";

export type AssetWorkflowType =
  | "sale-transfer-support"
  | "entity-authority"
  | "notarized-execution"
  | "apostille-support"
  | "escrow-document-support"
  | "registry-document-support"
  | "closing-package-support"
  | "consular-document-support"
  | "review-required";

export type AssetDocumentFamily =
  | "bill-of-sale"
  | "title-transfer"
  | "preferred-ship-mortgage"
  | "aircraft-bill-of-sale"
  | "entity-resolution"
  | "certificate-of-incumbency"
  | "power-of-attorney"
  | "apostille-package"
  | "escrow-instructions"
  | "customs-support-document"
  | "insurance-support-document"
  | "appraisal-support-document"
  | "provenance-support-document"
  | "review-required";

export interface AssetSafetyFlags {
  requiresLegalReview: boolean;
  requiresTitleReview: boolean;
  requiresCustomsReview: boolean;
  requiresUSCGReview: boolean;
  requiresFAAReview: boolean;
  requiresEscrowReview: boolean;
  requiresInsuranceReview: boolean;
  requiresSpecialistReview: boolean;
  cannotGuaranteeOutcome: boolean;
}

export interface HighValueAssetMatter {
  id: string;
  matterId: string | null;
  assetCategory: AssetCategory;
  workflowType: AssetWorkflowType;
  documentFamilies: AssetDocumentFamily[];
  urgency: string;
  jurisdiction: string | null;
  international: boolean;
  maritimeLinked: boolean;
  reviewRequired: boolean;
  operatorNextAction: string;
  safetyFlags: AssetSafetyFlags;
  createdAt: string | null;
}

export function emptySafetyFlags(): AssetSafetyFlags {
  return {
    requiresLegalReview: false,
    requiresTitleReview: false,
    requiresCustomsReview: false,
    requiresUSCGReview: false,
    requiresFAAReview: false,
    requiresEscrowReview: false,
    requiresInsuranceReview: false,
    requiresSpecialistReview: false,
    // Every high-value asset matter carries the no-guarantee flag by default.
    cannotGuaranteeOutcome: true,
  };
}
