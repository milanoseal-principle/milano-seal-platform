/**
 * assetClassifier — classify a high-value asset matter from free-text signals.
 * Conservative by design: unknown categories default to review-required, and no
 * legal sufficiency, title transfer, or regulatory approval is ever claimed.
 */

import {
  type AssetCategory,
  type AssetWorkflowType,
  type AssetDocumentFamily,
  type AssetSafetyFlags,
  type HighValueAssetMatter,
  emptySafetyFlags,
} from "@/lib/high-value-assets/types";

export interface AssetClassifierInput {
  text?: string;
  assetCategoryHint?: AssetCategory;
  jurisdiction?: string | null;
  international?: boolean;
  hoursRemaining?: number | null;
  paymentConfirmed?: boolean;
  documentReady?: boolean;
}

function t(input: AssetClassifierInput): string {
  return (input.text ?? "").toLowerCase();
}

export function classifyAssetCategory(input: AssetClassifierInput): AssetCategory {
  if (input.assetCategoryHint) return input.assetCategoryHint;
  const s = t(input);
  if (/\b(vessel|yacht|boat|ship|marina|maritime)\b/.test(s)) return "vessel";
  if (/\b(aircraft|airplane|plane|jet|faa)\b/.test(s)) return "aircraft";
  if (/\b(exotic|ferrari|lamborghini|supercar)\b/.test(s)) return "exotic-vehicle";
  if (/\b(classic car|collector car|vintage car)\b/.test(s)) return "classic-vehicle";
  if (/\b(art|painting|sculpture|collectible|antique)\b/.test(s)) return "art-collectible";
  if (/\b(jewelry|jewellery|watch|diamond|gemstone)\b/.test(s)) return "jewelry-watch";
  if (/\b(equipment|machinery|crane|excavator)\b/.test(s)) return "heavy-equipment";
  if (/\b(commercial asset|business asset)\b/.test(s)) return "commercial-asset";
  if (input.international || /\b(import|export|cross-border|overseas)\b/.test(s)) return "international-asset";
  return "unknown";
}

export function detectAssetWorkflowType(input: AssetClassifierInput): AssetWorkflowType {
  const s = t(input);
  if (/\b(apostille|legaliz)/.test(s)) return "apostille-support";
  if (/\b(escrow)\b/.test(s)) return "escrow-document-support";
  if (/\b(registry|register|documentation)\b/.test(s)) return "registry-document-support";
  if (/\b(closing|closing package)\b/.test(s)) return "closing-package-support";
  if (/\b(consular|embassy|consulate)\b/.test(s)) return "consular-document-support";
  if (/\b(resolution|incumbency|entity|corporate authority)\b/.test(s)) return "entity-authority";
  if (/\b(sale|transfer|bill of sale|title)\b/.test(s)) return "sale-transfer-support";
  if (/\b(notariz|notary|sign)/.test(s)) return "notarized-execution";
  return "review-required";
}

export function detectAssetDocumentFamilies(input: AssetClassifierInput): AssetDocumentFamily[] {
  const s = t(input);
  const fams = new Set<AssetDocumentFamily>();
  if (/\bpreferred ship mortgage\b/.test(s)) fams.add("preferred-ship-mortgage");
  if (/\baircraft bill of sale\b/.test(s)) fams.add("aircraft-bill-of-sale");
  if (/\bbill of sale\b/.test(s)) fams.add("bill-of-sale");
  if (/\btitle\b/.test(s)) fams.add("title-transfer");
  if (/\bresolution\b/.test(s)) fams.add("entity-resolution");
  if (/\bincumbency\b/.test(s)) fams.add("certificate-of-incumbency");
  if (/\bpower of attorney|poa\b/.test(s)) fams.add("power-of-attorney");
  if (/\bapostille|legaliz/.test(s)) fams.add("apostille-package");
  if (/\bescrow\b/.test(s)) fams.add("escrow-instructions");
  if (/\bcustoms|import|export\b/.test(s)) fams.add("customs-support-document");
  if (/\binsurance\b/.test(s)) fams.add("insurance-support-document");
  if (/\bappraisal\b/.test(s)) fams.add("appraisal-support-document");
  if (/\bprovenance\b/.test(s)) fams.add("provenance-support-document");
  if (fams.size === 0) fams.add("review-required");
  return [...fams];
}

export function detectReviewRequirements(input: AssetClassifierInput): AssetSafetyFlags {
  const s = t(input);
  const flags = emptySafetyFlags();
  const category = classifyAssetCategory(input);

  if (category === "vessel" || /\bpreferred ship mortgage|uscg\b/.test(s)) {
    flags.requiresUSCGReview = true;
    flags.requiresLegalReview = true;
    flags.requiresTitleReview = true;
  }
  if (category === "aircraft" || /\bfaa|aircraft\b/.test(s)) {
    flags.requiresFAAReview = true;
    flags.requiresSpecialistReview = true;
  }
  if (/\btitle|ownership|transfer\b/.test(s)) {
    flags.requiresTitleReview = true;
    flags.requiresLegalReview = true;
  }
  if (/\bcustoms|import|export\b/.test(s)) flags.requiresCustomsReview = true;
  if (/\bescrow\b/.test(s)) flags.requiresEscrowReview = true;
  if (/\binsurance\b/.test(s)) flags.requiresInsuranceReview = true;
  if (/\bappraisal|provenance|valuation\b/.test(s)) flags.requiresSpecialistReview = true;
  return flags;
}

export function buildHighValueAssetMatter(input: AssetClassifierInput): HighValueAssetMatter {
  const assetCategory = classifyAssetCategory(input);
  const workflowType = detectAssetWorkflowType(input);
  const documentFamilies = detectAssetDocumentFamilies(input);
  const safetyFlags = detectReviewRequirements(input);
  const maritimeLinked = assetCategory === "vessel";
  const international = Boolean(input.international) || documentFamilies.includes("apostille-package");
  const reviewRequired =
    workflowType === "review-required" ||
    assetCategory === "unknown" ||
    documentFamilies.includes("review-required") ||
    Object.entries(safetyFlags).some(([k, v]) => k !== "cannotGuaranteeOutcome" && v === true);

  const operatorNextAction =
    input.paymentConfirmed === false
      ? "verify_payment"
      : reviewRequired
        ? "route_specialist_review"
        : "review_document_readiness";

  return {
    id: `hva-${assetCategory}-${workflowType}`,
    matterId: null,
    assetCategory,
    workflowType,
    documentFamilies,
    urgency: "review-required",
    jurisdiction: input.jurisdiction ?? null,
    international,
    maritimeLinked,
    reviewRequired,
    operatorNextAction,
    safetyFlags,
    createdAt: null,
  };
}
