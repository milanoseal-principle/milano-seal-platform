export interface TranslationAccuracyAffidavit {
  affidavitRequired: boolean;
  notarizationRequired: boolean;
  note: string;
}

export function evaluateAccuracyAffidavit(input: {
  receivingAuthoritySpecific: boolean;
}): TranslationAccuracyAffidavit {
  return {
    affidavitRequired: input.receivingAuthoritySpecific,
    notarizationRequired: input.receivingAuthoritySpecific,
    note: "A translation accuracy affidavit may require notarization and, if apostilled, follows notarized-document routing.",
  };
}
