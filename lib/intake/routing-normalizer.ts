/**
 * Centralized intake routing normalizer.
 *
 * Converts raw user-submitted intake payload fields into a deterministic
 * NormalizedRoutingContext that drives routing, pricing, and display labels.
 *
 * IMPORTANT: origin_state from the frontend is an untrusted user selection —
 * this normalizer is the single source of truth for origin authority type.
 */

export type OriginAuthorityType =
  | "florida_ron_notarial_act"
  | "state_issued_document"
  | "federal_document"
  | "court_document"
  | "corporate_state_record"
  | "foreign_issued_document"
  | "unknown_operator_review";

export type ApostillePath =
  | "florida_apostille"
  | "state_apostille"
  | "federal_apostille"
  | "consular_legalization"
  | "operator_review";

export type NormalizedRoutingContext = {
  origin_authority_type: OriginAuthorityType;
  origin_authority_label: string;
  origin_country?: string;
  origin_state?: string;
  origin_county?: string;
  origin_city?: string;
  federal_agency?: string;
  issuing_authority?: string;
  destination_country?: string;
  destination_region?: string;
  destination_locality?: string;
  apostille_path: ApostillePath;
  requires_operator_review: boolean;
  warnings: string[];
};

/** Normalize a raw field value to string, returning empty string if absent. */
function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

/** Case-insensitive substring test. */
function contains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

const FEDERAL_AGENCY_PATTERNS: { pattern: string; agency: string }[] = [
  { pattern: "irs", agency: "IRS" },
  { pattern: "internal revenue", agency: "IRS" },
  { pattern: "uscis", agency: "USCIS" },
  { pattern: "immigration", agency: "USCIS" },
  { pattern: "social security", agency: "Social Security Administration" },
  { pattern: "ssa", agency: "Social Security Administration" },
  { pattern: "uspto", agency: "USPTO" },
  { pattern: "patent", agency: "USPTO" },
  { pattern: "trademark", agency: "USPTO" },
  { pattern: "federal court", agency: "U.S. Federal Court" },
  { pattern: "u.s. court", agency: "U.S. Federal Court" },
  { pattern: "department of state", agency: "U.S. Department of State" },
  { pattern: "state department", agency: "U.S. Department of State" },
  { pattern: "fbi", agency: "FBI" },
  { pattern: "federal bureau", agency: "FBI" },
];

function formatApostillePath(path: ApostillePath): string {
  return path
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function normalizeIntakeRouting(
  payload: Record<string, unknown>,
): NormalizedRoutingContext {
  const documentType = str(payload.document_type || payload.document);
  const executionMethod = str(
    payload.execution_method ||
      payload.execution_type ||
      payload.witness_type ||
      "",
  );
  const rawOriginState = str(payload.origin_state || payload.state);
  const originCountry = str(payload.origin_country || "");
  const destinationCountry = str(
    payload.destination_country || payload.country || "",
  );
  const issuingAuthority = str(
    payload.issuing_authority || payload.issuing_agency || "",
  );

  const warnings: string[] = [];
  const ctx: NormalizedRoutingContext = {
    origin_authority_type: "unknown_operator_review",
    origin_authority_label: "Unknown — Operator Review Required",
    apostille_path: "operator_review",
    requires_operator_review: true,
    warnings,
    destination_country: destinationCountry || undefined,
    issuing_authority: issuingAuthority || undefined,
  };

  // Propagate passthrough fields
  if (rawOriginState) ctx.origin_state = rawOriginState;
  if (originCountry) ctx.origin_country = originCountry;

  const isRON =
    contains(executionMethod, "ron") ||
    contains(executionMethod, "remote online") ||
    contains(executionMethod, "remote") ||
    // intake-wizard sends execution_type="RON"
    str(payload.execution_type).toUpperCase() === "RON";

  const isAffidavit = contains(documentType, "affidavit");
  const isFederalOrigin =
    contains(rawOriginState, "federal") ||
    contains(rawOriginState, "fbi") ||
    contains(issuingAuthority, "fbi") ||
    contains(issuingAuthority, "federal");

  // ── Rule 1: One and Same Affidavit + RON ─────────────────────────────────
  const isOneAndSame =
    contains(documentType, "one and the same") ||
    contains(documentType, "one and same") ||
    contains(documentType, "name discrepancy affidavit");

  if (isOneAndSame && isRON) {
    if (isFederalOrigin) {
      warnings.push(
        "Federal (FBI) was selected, but this document type is a RON-executed affidavit. " +
          "Routing corrected to Florida RON Notarial Act.",
      );
    }
    return {
      ...ctx,
      origin_authority_type: "florida_ron_notarial_act",
      origin_authority_label: "Florida RON Notarial Act",
      origin_state: "Florida",
      apostille_path: resolveDestinationApostillePath(
        "florida_apostille",
        destinationCountry,
        warnings,
      ),
      requires_operator_review:
        isUAEDestination(destinationCountry) ? true : false,
      warnings,
    };
  }

  // ── Rule 2: FBI Background Check ─────────────────────────────────────────
  const isFBI =
    contains(documentType, "fbi") ||
    contains(documentType, "background check") ||
    contains(issuingAuthority, "fbi") ||
    contains(issuingAuthority, "federal bureau");

  if (isFBI) {
    const apostillePath = resolveDestinationApostillePath(
      "federal_apostille",
      destinationCountry,
      warnings,
    );
    return {
      ...ctx,
      origin_authority_type: "federal_document",
      origin_authority_label: "Federal (FBI)",
      federal_agency: "FBI",
      apostille_path: apostillePath,
      requires_operator_review: isUAEDestination(destinationCountry),
      warnings,
    };
  }

  // ── Rule 8 (early): Foreign-issued documents — must precede all document-type rules ─
  // so that e.g. a Mexican birth certificate is foreign_issued, not state_issued.
  if (
    originCountry &&
    !contains(originCountry, "united states") &&
    originCountry.toUpperCase() !== "US" &&
    originCountry.toUpperCase() !== "USA"
  ) {
    warnings.push(
      `Document appears to be foreign-issued (origin country: ${originCountry}). Operator review required.`,
    );
    return {
      ...ctx,
      origin_authority_type: "foreign_issued_document",
      origin_authority_label: `${originCountry} Issuing Authority`,
      origin_country: originCountry,
      apostille_path: "operator_review",
      requires_operator_review: true,
      warnings,
    };
  }

  // ── Rule 3: Vital Records ─────────────────────────────────────────────────
  const isVitalRecord =
    contains(documentType, "birth certificate") ||
    contains(documentType, "death certificate") ||
    contains(documentType, "marriage certificate") ||
    contains(documentType, "vital record");

  if (isVitalRecord) {
    const stateLabel = rawOriginState || "State";
    const apostillePath = resolveDestinationApostillePath(
      "state_apostille",
      destinationCountry,
      warnings,
    );
    const needsReview = !rawOriginState || isUAEDestination(destinationCountry);
    if (!rawOriginState) {
      warnings.push(
        "Origin state missing for vital record. Operator review required to confirm issuing authority.",
      );
    }
    return {
      ...ctx,
      origin_authority_type: "state_issued_document",
      origin_authority_label: `${stateLabel} Vital Records / Registrar`,
      origin_state: rawOriginState || undefined,
      apostille_path: apostillePath,
      requires_operator_review: needsReview,
      warnings,
    };
  }

  // ── Rule 4: Court Documents ───────────────────────────────────────────────
  const isCourtDoc =
    contains(documentType, "court") ||
    contains(documentType, "judgment") ||
    contains(documentType, "divorce decree") ||
    contains(documentType, "certified court") ||
    contains(documentType, "court order");

  if (isCourtDoc) {
    const isFederalCourt =
      contains(documentType, "federal court") ||
      contains(issuingAuthority, "federal court") ||
      contains(issuingAuthority, "u.s. court");
    const defaultPath: ApostillePath = isFederalCourt
      ? "federal_apostille"
      : "state_apostille";
    const apostillePath = resolveDestinationApostillePath(
      defaultPath,
      destinationCountry,
      warnings,
    );
    const courtUnclear =
      !isFederalCourt && !rawOriginState && !issuingAuthority;
    return {
      ...ctx,
      origin_authority_type: "court_document",
      origin_authority_label: isFederalCourt
        ? "U.S. Federal Court"
        : `${rawOriginState || "State"} Court`,
      origin_state: rawOriginState || undefined,
      apostille_path: apostillePath,
      requires_operator_review: courtUnclear || isUAEDestination(destinationCountry),
      warnings,
    };
  }

  // ── Rule 5: Corporate / Business Records ──────────────────────────────────
  const isCorporate =
    contains(documentType, "articles") ||
    contains(documentType, "certificate of good standing") ||
    contains(documentType, "corporate") ||
    contains(documentType, "llc") ||
    contains(documentType, "business record") ||
    contains(documentType, "corporate resolution") ||
    contains(documentType, "articles of incorporation");

  if (isCorporate) {
    const stateLabel = rawOriginState || "State";
    const apostillePath = resolveDestinationApostillePath(
      "state_apostille",
      destinationCountry,
      warnings,
    );
    return {
      ...ctx,
      origin_authority_type: "corporate_state_record",
      origin_authority_label: `${stateLabel} Secretary of State / Corporate Records`,
      origin_state: rawOriginState || undefined,
      apostille_path: apostillePath,
      requires_operator_review: isUAEDestination(destinationCountry),
      warnings,
    };
  }

  // ── Rule 6: Other Federal Agencies ───────────────────────────────────────
  const federalAgencyMatch = FEDERAL_AGENCY_PATTERNS.find(
    ({ pattern }) =>
      contains(issuingAuthority, pattern) ||
      contains(rawOriginState, pattern) ||
      contains(documentType, pattern),
  );

  if (federalAgencyMatch) {
    const apostillePath = resolveDestinationApostillePath(
      "federal_apostille",
      destinationCountry,
      warnings,
    );
    return {
      ...ctx,
      origin_authority_type: "federal_document",
      origin_authority_label: `Federal — ${federalAgencyMatch.agency}`,
      federal_agency: federalAgencyMatch.agency,
      apostille_path: apostillePath,
      requires_operator_review: isUAEDestination(destinationCountry),
      warnings,
    };
  }

  // ── Rule 7: UAE destination / state doc catch-all ────────────────────────
  // Applied on top of resolved path — also acts as catch-all for state docs
  if (rawOriginState && !isFederalOrigin) {
    // Plain state-issued document (Power of Attorney, etc.)
    const apostillePath = resolveDestinationApostillePath(
      "state_apostille",
      destinationCountry,
      warnings,
    );
    // Safety: affidavit with federal origin flag → warn
    if (isAffidavit && isFederalOrigin) {
      warnings.push(
        "Document is an affidavit but origin_authority_type resolved to federal_document. " +
          "Manual operator review required to confirm correct routing.",
      );
      return {
        ...ctx,
        origin_authority_type: "federal_document",
        origin_authority_label: "Federal — Operator Review Required",
        apostille_path: apostillePath,
        requires_operator_review: true,
        warnings,
      };
    }
    return {
      ...ctx,
      origin_authority_type: "state_issued_document",
      origin_authority_label: `${rawOriginState} Notarial Act / State Record`,
      origin_state: rawOriginState,
      apostille_path: apostillePath,
      requires_operator_review: isUAEDestination(destinationCountry),
      warnings,
    };
  }

  // ── Default fallback ──────────────────────────────────────────────────────
  warnings.push(
    "Could not determine origin authority from provided fields. Operator review required.",
  );
  return ctx;
}

/** Safety check for affidavit + federal combination */
export function checkAffidavitFederalConflict(
  ctx: NormalizedRoutingContext,
  documentType: string,
): NormalizedRoutingContext {
  if (
    ctx.origin_authority_type === "federal_document" &&
    documentType.toLowerCase().includes("affidavit")
  ) {
    // Only flag if NOT an explicitly federal affidavit
    const isExplicitlyFederal =
      documentType.toLowerCase().includes("fbi") ||
      documentType.toLowerCase().includes("federal");
    if (!isExplicitlyFederal) {
      return {
        ...ctx,
        requires_operator_review: true,
        warnings: [
          ...ctx.warnings,
          "Affidavit document type with federal_document origin detected. " +
            "Verify this is not a RON-executed affidavit incorrectly classified as federal.",
        ],
      };
    }
  }
  return ctx;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isUAEDestination(destination: string): boolean {
  return (
    contains(destination, "uae") ||
    contains(destination, "united arab emirates")
  );
}

function resolveDestinationApostillePath(
  defaultPath: ApostillePath,
  destination: string,
  warnings: string[],
): ApostillePath {
  // UAE pathways remain receiving-authority specific. Do not automatically
  // classify every matter as either apostille-only or consular-only.
  if (isUAEDestination(destination)) {
    warnings.push(
      "UAE pathway verification is required. Confirm the current receiving-authority requirements before selecting apostille or consular legalization.",
    );
    return "operator_review";
  }
  return defaultPath;
}

export { formatApostillePath };
