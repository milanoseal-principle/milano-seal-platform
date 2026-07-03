import type { DocumentAuthority } from "./types";

export interface MultiDocumentBundleRule {
  mixedStateFederal: boolean;
  requiresSplitRouting: boolean;
  note: string;
}

export function evaluateBundle(
  authorities: DocumentAuthority[]
): MultiDocumentBundleRule {
  const hasFederal = authorities.some(
    (a) => a === "fbi_background_check" || a === "federal_agency_document"
  );
  const hasState = authorities.some(
    (a) => a !== "fbi_background_check" && a !== "federal_agency_document" && a !== "unknown"
  );
  const mixedStateFederal = hasFederal && hasState;
  return {
    mixedStateFederal,
    requiresSplitRouting: mixedStateFederal,
    note: mixedStateFederal
      ? "Bundle contains both federal and state documents — route separately by authority."
      : "Single-authority bundle — route by document authority.",
  };
}
