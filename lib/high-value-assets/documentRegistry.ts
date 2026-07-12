/**
 * documentRegistry — high-value asset document families with client-safe
 * descriptions. Descriptions never guarantee outcomes; everything is
 * review-dependent. Reuses the Maritime document-family vocabulary where relevant.
 */

import type { AssetDocumentFamily } from "@/lib/high-value-assets/types";

export interface AssetDocumentEntry {
  family: AssetDocumentFamily;
  label: string;
  notarizationLikely: boolean;
  apostillePossible: boolean;
  reviewRequired: boolean;
  operatorNote: string;
  clientSafeDescription: string;
}

const REVIEW_DEPENDENT =
  "May support notarized execution or apostille coordination depending on jurisdiction and receiving-party requirements. Review may be required before scheduling.";

export const ASSET_DOCUMENT_REGISTRY: AssetDocumentEntry[] = [
  { family: "bill-of-sale", label: "Bill of Sale", notarizationLikely: true, apostillePossible: true, reviewRequired: false, operatorNote: "Confirm parties and signer authority.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "title-transfer", label: "Title Transfer Document", notarizationLikely: true, apostillePossible: false, reviewRequired: true, operatorNote: "Title/legal review required — Milano Seal does not transfer title.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "preferred-ship-mortgage", label: "Preferred Ship Mortgage", notarizationLikely: true, apostillePossible: false, reviewRequired: true, operatorNote: "USCG/legal/title review; bridge to Maritime.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "aircraft-bill-of-sale", label: "Aircraft Bill of Sale", notarizationLikely: true, apostillePossible: false, reviewRequired: true, operatorNote: "FAA/specialist review required.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "entity-resolution", label: "Entity Resolution", notarizationLikely: true, apostillePossible: true, reviewRequired: false, operatorNote: "Confirm corporate authority.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "certificate-of-incumbency", label: "Certificate of Incumbency", notarizationLikely: true, apostillePossible: true, reviewRequired: false, operatorNote: "Often used abroad.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "power-of-attorney", label: "Power of Attorney", notarizationLikely: true, apostillePossible: true, reviewRequired: false, operatorNote: "Witness/apostille destination-dependent.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "apostille-package", label: "Apostille Package", notarizationLikely: false, apostillePossible: true, reviewRequired: false, operatorNote: "International handling.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "escrow-instructions", label: "Escrow Instructions", notarizationLikely: false, apostillePossible: false, reviewRequired: true, operatorNote: "Escrow professional review required.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "customs-support-document", label: "Customs Support Document", notarizationLikely: false, apostillePossible: false, reviewRequired: true, operatorNote: "Customs broker review — no customs conclusions provided.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "insurance-support-document", label: "Insurance Support Document", notarizationLikely: false, apostillePossible: false, reviewRequired: true, operatorNote: "Insurance professional review — Milano Seal does not insure assets.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "appraisal-support-document", label: "Appraisal Support Document", notarizationLikely: true, apostillePossible: false, reviewRequired: true, operatorNote: "Specialist review — value is not certified by Milano Seal.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "provenance-support-document", label: "Provenance Support Document", notarizationLikely: true, apostillePossible: false, reviewRequired: true, operatorNote: "Specialist review — provenance not verified as fact.", clientSafeDescription: REVIEW_DEPENDENT },
  { family: "review-required", label: "Review Required", notarizationLikely: false, apostillePossible: false, reviewRequired: true, operatorNote: "Unclassified — route to review.", clientSafeDescription: REVIEW_DEPENDENT },
];

export function getAssetDocument(family: AssetDocumentFamily): AssetDocumentEntry | null {
  return ASSET_DOCUMENT_REGISTRY.find((d) => d.family === family) ?? null;
}
