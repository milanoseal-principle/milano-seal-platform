import type { CountryRecord, ManualReviewFlag } from "./types";
import { getCountryByIso } from "./countryRegistry";
import { classifyHague } from "./hagueStatus";
import { getTranslationRule } from "./translationRules";
import { getProcessingNote } from "./processingNotes";

// Manual review flag logic. Any of: missing source data, stale/unknown Hague
// status, or unknown destination should raise a flag. This is a defensive
// backstop — flags never authorize execution, they only surface uncertainty.

export interface DestinationReviewInput {
  destinationIso?: string;
  // Optional last-verified date (ISO) for staleness checks.
  lastVerified?: string | null;
  // Consider data older than this many days stale.
  staleAfterDays?: number;
}

export function evaluateDestinationFlags(
  input: DestinationReviewInput,
): ManualReviewFlag[] {
  const flags: ManualReviewFlag[] = [];
  const iso = input.destinationIso?.trim().toUpperCase();

  if (!iso) {
    flags.push({
      code: "MISSING_DESTINATION",
      message: "No destination provided — cannot assess; manual review required.",
      severity: "blocker",
    });
    return flags;
  }

  const record: CountryRecord | undefined = getCountryByIso(iso);
  if (!record) {
    flags.push({
      code: "UNKNOWN_DESTINATION",
      message: `Destination ${iso} is not in the registry — manual review required.`,
      severity: "blocker",
      subject: iso,
    });
    return flags;
  }

  if (record.requiresManualReview) {
    flags.push({
      code: "RECORD_FLAGGED",
      message: "Country record is marked uncertain — verify before execution.",
      severity: "warning",
      subject: iso,
    });
  }

  const hague = classifyHague(record);
  if (hague.status === "unknown" || hague.requiresManualReview) {
    flags.push({
      code: "HAGUE_UNCERTAIN",
      message: hague.note,
      severity: hague.status === "unknown" ? "blocker" : "warning",
      subject: iso,
    });
  }

  if (getTranslationRule(iso).requiresManualReview) {
    flags.push({
      code: "TRANSLATION_UNSOURCED",
      message: "Translation requirement not sourced — manual review required.",
      severity: "warning",
      subject: iso,
    });
  }

  if (getProcessingNote(iso).requiresManualReview) {
    flags.push({
      code: "PROCESSING_UNSOURCED",
      message: "Processing/courier note not sourced — manual review required.",
      severity: "warning",
      subject: iso,
    });
  }

  const staleFlag = evaluateStaleness(input, iso);
  if (staleFlag) flags.push(staleFlag);

  return flags;
}

function evaluateStaleness(
  input: DestinationReviewInput,
  iso: string,
): ManualReviewFlag | null {
  if (input.lastVerified === undefined) return null;
  if (!input.lastVerified) {
    return {
      code: "NEVER_VERIFIED",
      message: "Record has no verification date — manual review required.",
      severity: "warning",
      subject: iso,
    };
  }
  const verified = Date.parse(input.lastVerified);
  if (Number.isNaN(verified)) {
    return {
      code: "BAD_VERIFIED_DATE",
      message: "Verification date unparseable — manual review required.",
      severity: "warning",
      subject: iso,
    };
  }
  const staleAfter = input.staleAfterDays ?? 180;
  const ageDays = (Date.now() - verified) / (1000 * 60 * 60 * 24);
  if (ageDays > staleAfter) {
    return {
      code: "STALE_DATA",
      message: `Data last verified ${Math.round(ageDays)} days ago — re-verify before execution.`,
      severity: "warning",
      subject: iso,
    };
  }
  return null;
}
