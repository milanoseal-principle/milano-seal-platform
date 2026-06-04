// BlueNotary Smart Tag Builder
// Tag strings follow the BlueNotary smart-tag annotation format.

export type SmartTagPreset =
  | 'ACKNOWLEDGMENT_BASIC'
  | 'JURAT_BASIC'
  | 'MULTI_SIGNER_AFFIDAVIT'
  | 'POA_REVIEW_REQUIRED'
  | 'CERTIFICATE_ATTACHMENT';

export interface SmartTagConfig {
  preset: SmartTagPreset;
  tags: string[];
  requiresOperatorReview: boolean;
  description: string;
}

/** Canonical smart-tag strings */
export const TAG = {
  NOTARY_SIGNATURE:  '[!eNotary.Signature.W=120.H=40]',
  NOTARY_SEAL:       '[!eNotary.Seal.W=180.H=90]',
  SCHEDULE_DATE:     '[!ScheduleDate]',
  SIGNER_1:          '[!Sign.1.W=100.H=30]',
  SIGNER_2:          '[!Sign.2.W=100.H=30]',
  SIGNER_1_ID_TYPE:  '[!Sign1.idType.W=120.H=25]',
} as const;

export const TAG_PRESETS: Record<SmartTagPreset, SmartTagConfig> = {
  ACKNOWLEDGMENT_BASIC: {
    preset: 'ACKNOWLEDGMENT_BASIC',
    description: 'Standard acknowledgment — signer signature, date, notary signature and seal',
    requiresOperatorReview: false,
    tags: [
      TAG.SIGNER_1,
      TAG.SCHEDULE_DATE,
      TAG.NOTARY_SIGNATURE,
      TAG.NOTARY_SEAL,
    ],
  },

  JURAT_BASIC: {
    preset: 'JURAT_BASIC',
    description: 'Jurat — signer signature, date, signer ID type, notary signature and seal',
    requiresOperatorReview: false,
    tags: [
      TAG.SIGNER_1,
      TAG.SCHEDULE_DATE,
      TAG.SIGNER_1_ID_TYPE,
      TAG.NOTARY_SIGNATURE,
      TAG.NOTARY_SEAL,
    ],
  },

  MULTI_SIGNER_AFFIDAVIT: {
    preset: 'MULTI_SIGNER_AFFIDAVIT',
    description: 'Multi-signer affidavit — two signer signatures, date, notary signature and seal',
    requiresOperatorReview: false,
    tags: [
      TAG.SIGNER_1,
      TAG.SIGNER_2,
      TAG.SCHEDULE_DATE,
      TAG.NOTARY_SIGNATURE,
      TAG.NOTARY_SEAL,
    ],
  },

  POA_REVIEW_REQUIRED: {
    preset: 'POA_REVIEW_REQUIRED',
    description: 'Power of Attorney — do not auto-tag; operator review required before upload',
    requiresOperatorReview: true,
    tags: [],
  },

  CERTIFICATE_ATTACHMENT: {
    preset: 'CERTIFICATE_ATTACHMENT',
    description: 'Certificate attachment — notary signature, seal, date; operator review required',
    requiresOperatorReview: true,
    tags: [
      TAG.NOTARY_SIGNATURE,
      TAG.NOTARY_SEAL,
      TAG.SCHEDULE_DATE,
    ],
  },
};

/**
 * Resolve the smart-tag preset for a given document type.
 * Returns null if auto-tagging is not supported for this document type.
 */
export function resolvePresetForDocumentType(
  documentType: string | null | undefined
): SmartTagConfig | null {
  const normalized = (documentType ?? '').toLowerCase();

  if (normalized.includes('acknowledgment') || normalized.includes('affidavit') && !normalized.includes('multi')) {
    return TAG_PRESETS.ACKNOWLEDGMENT_BASIC;
  }
  if (normalized.includes('jurat')) {
    return TAG_PRESETS.JURAT_BASIC;
  }
  if (normalized.includes('multi') || normalized.includes('two signer')) {
    return TAG_PRESETS.MULTI_SIGNER_AFFIDAVIT;
  }
  if (normalized.includes('power of attorney') || normalized.includes('poa')) {
    return TAG_PRESETS.POA_REVIEW_REQUIRED;
  }
  if (normalized.includes('certificate') || normalized.includes('attachment')) {
    return TAG_PRESETS.CERTIFICATE_ATTACHMENT;
  }

  // Default to operator review for unrecognized types
  return null;
}

/** Build the tag list for a document payload */
export function buildSmartTags(preset: SmartTagPreset): string[] {
  return TAG_PRESETS[preset].tags;
}
