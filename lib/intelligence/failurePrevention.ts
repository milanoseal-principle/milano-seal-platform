export type FailurePattern = {
  id: string;
  pattern_type: string;
  description: string;
  check: (
    matter: Record<string, unknown>,
    tasks: Record<string, unknown>[]
  ) => boolean;
  warning: string;
  severity: "INFO" | "WARNING" | "STOP";
};

export type FailureCheckResult = {
  matched: boolean;
  patterns: Array<{
    id: string;
    warning: string;
    severity: FailurePattern["severity"];
  }>;
};

const NON_HAGUE_COUNTRIES = new Set([
  "saudi arabia",
  "uae",
  "united arab emirates",
  "qatar",
  "kuwait",
  "vietnam",
  "china",
  "lebanon",
]);

const NON_ENGLISH_COUNTRIES = new Set([
  "france",
  "germany",
  "spain",
  "italy",
  "italia",
  "portugal",
  "brazil",
  "mexico",
  "argentina",
  "colombia",
  "chile",
  "peru",
  "venezuela",
  "ecuador",
  "china",
  "japan",
  "south korea",
  "vietnam",
  "thailand",
  "indonesia",
  "saudi arabia",
  "uae",
  "united arab emirates",
  "qatar",
  "kuwait",
  "lebanon",
  "egypt",
  "morocco",
  "russia",
  "ukraine",
  "poland",
  "czech republic",
  "hungary",
  "romania",
  "greece",
  "turkey",
  "israel",
]);

const BUILT_IN_PATTERNS: FailurePattern[] = [
  {
    id: "italy_missing_codice_fiscale",
    pattern_type: "missing_codice_fiscale",
    description:
      "Italian matters require codice fiscale for the signer.",
    check: (matter, tasks) => {
      const dest = String(matter.destination_country ?? "").toLowerCase();
      const docType = String(matter.document_type ?? "").toLowerCase();
      const isItaly = dest.includes("italy") || dest.includes("italia");
      const isPassport = docType.includes("passport");
      if (!isItaly || isPassport) return false;
      const hasCodiceFiscaleTask = tasks.some((t) =>
        String(t.task_type ?? "").includes("codice_fiscale")
      );
      return !hasCodiceFiscaleTask;
    },
    warning:
      "Italian matters require codice fiscale. Confirm signer tax code is collected.",
    severity: "WARNING",
  },
  {
    id: "apostille_non_hague_country",
    pattern_type: "apostille_non_hague_country",
    description:
      "Destination is not a Hague Convention member — apostille not accepted.",
    check: (matter) => {
      const dest = String(matter.destination_country ?? "").toLowerCase();
      return NON_HAGUE_COUNTRIES.has(dest);
    },
    warning:
      "This destination is not a Hague Convention member. Apostille is not accepted — legalization required instead.",
    severity: "WARNING",
  },
  {
    id: "ron_document_type_mismatch",
    pattern_type: "ron_document_type_mismatch",
    description:
      "Immigration documents may have RON acceptance restrictions.",
    check: (matter, tasks) => {
      const docType = String(matter.document_type ?? "").toLowerCase();
      const hasRonTask = tasks.some((t) =>
        String(t.task_type ?? "").toLowerCase().includes("ron")
      );
      return docType.includes("immigration") && hasRonTask;
    },
    warning:
      "Immigration documents may have RON acceptance restrictions at destination. Confirm RON eligibility before scheduling.",
    severity: "WARNING",
  },
  {
    id: "missing_translation_flag",
    pattern_type: "missing_translation_flag",
    description:
      "Destination may require certified translation.",
    check: (matter, tasks) => {
      const dest = String(matter.destination_country ?? "").toLowerCase();
      const isNonEnglish = NON_ENGLISH_COUNTRIES.has(dest);
      if (!isNonEnglish) return false;
      const hasTranslationTask = tasks.some((t) =>
        String(t.task_type ?? "").toLowerCase().includes("translation")
      );
      return !hasTranslationTask;
    },
    warning:
      "Destination may require certified translation. Verify translation requirement.",
    severity: "INFO",
  },
  {
    id: "duplicate_matter_risk",
    pattern_type: "duplicate_matter_risk",
    description:
      "Possible duplicate matter detected for this client.",
    check: (matter) => {
      // This check requires DB — handled externally via the _duplicateMatched flag
      return !!(matter._duplicateMatched);
    },
    warning:
      "Possible duplicate matter. Review active matters for this client before proceeding.",
    severity: "STOP",
  },
];

export function checkFailurePatterns(
  matter: Record<string, unknown>,
  tasks: Record<string, unknown>[]
): FailureCheckResult {
  const matched: FailureCheckResult["patterns"] = [];

  for (const pattern of BUILT_IN_PATTERNS) {
    if (pattern.check(matter, tasks)) {
      matched.push({
        id: pattern.id,
        warning: pattern.warning,
        severity: pattern.severity,
      });
    }
  }

  return {
    matched: matched.length > 0,
    patterns: matched,
  };
}
