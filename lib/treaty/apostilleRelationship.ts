import {
  HCCH_APOSTILLE_SOURCE,
  HCCH_CONTRACTING_PARTIES,
  HCCH_DECLARED_NON_APPLICATION,
  HCCH_DOCUMENT_LIMITATIONS,
  HCCH_OBJECTIONS,
  HCCH_RECOGNITION_RESERVATIONS,
  HCCH_UNCONTROLLED_TERRITORY_NOTES,
  hcchParty,
  hcchTerritory,
} from "./hcchApostilleStatus";

// Deterministic, date-aware evaluation of whether the Apostille Convention applies between two
// places. Membership alone is never enough: Article 12 objections, declarations, territorial
// scope and entry-into-force dates are all applied, and anything the registry cannot establish
// returns OFFICIAL_REVIEW_REQUIRED. The result describes the treaty relationship only. It is not
// legal advice and never establishes that a receiving authority will accept a document.

export type ApostilleRelationshipStatus =
  | "APOSTILLE_APPLICABLE"
  | "APOSTILLE_NOT_APPLICABLE"
  | "FUTURE_EFFECTIVE"
  | "OFFICIAL_REVIEW_REQUIRED";

export type ApostilleRelationshipInput = {
  origin: string; // ISO 3166-1 alpha-2 code or common English name of where the document was issued
  destination: string;
  evaluationDate?: string; // ISO date; defaults to today (UTC)
  documentType?: string | null;
  documentOrigin?: string | null; // canonical document-origin classification, when known
};

export type ApostilleRelationship = {
  status: ApostilleRelationshipStatus;
  origin: string | null; // resolved code
  destination: string | null;
  evaluationDate: string;
  effectiveFrom: string | null; // date the relationship is/was in force, when the registry knows it
  reasons: string[];
  notes: string[];
  source: typeof HCCH_APOSTILLE_SOURCE;
};

// How long after the last official verification the registry may be used without re-verification.
export const HCCH_REGISTRY_MAX_AGE_DAYS = 180;

const ALIASES: Record<string, string> = {
  uk: "GB", "united kingdom": "GB", "great britain": "GB", england: "GB", scotland: "GB", wales: "GB", "northern ireland": "GB",
  usa: "US", "united states": "US", "u.s.": "US", "u.s.a.": "US", america: "US",
  bolivia: "BO", china: "CN", "czech republic": "CZ", netherlands: "NL", "the netherlands": "NL", holland: "NL",
  "south korea": "KR", korea: "KR", moldova: "MD", russia: "RU", turkey: "TR", turkiye: "TR", venezuela: "VE",
  vietnam: "VN", "cape verde": "CV", "são tomé and príncipe": "ST", "sao tome": "ST", swaziland: "SZ", macedonia: "MK",
  brunei: "BN", "hong kong": "HK", macau: "MO", macao: "MO", "macao sar": "MO", "hong kong sar": "HK",
  uae: "AE", "united arab emirates": "AE", "st. lucia": "LC", "st lucia": "LC", "st. kitts and nevis": "KN", "st kitts and nevis": "KN",
  "st. vincent and the grenadines": "VC", "st vincent and the grenadines": "VC", bahamas: "BS", "the bahamas": "BS",
  aruba: "AW", curacao: "CW", "curaçao": "CW", "sint maarten": "SX", greenland: "GL", "faroe islands": "FO", gibraltar: "GI",
  bermuda: "BM", "cayman islands": "KY", "british virgin islands": "VG", jersey: "JE", guernsey: "GG", "isle of man": "IM",
};

let regionNames: Intl.DisplayNames | null = null;
let nameIndex: Map<string, string> | null = null;

function index(): Map<string, string> {
  if (nameIndex) return nameIndex;
  regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
  const map = new Map<string, string>(Object.entries(ALIASES));
  for (const party of HCCH_CONTRACTING_PARTIES) map.set(party.name.toLowerCase(), party.iso2);
  // Every ISO region's English name, so non-party countries resolve to a real code instead of "unknown".
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      const name = regionNames.of(code);
      if (name && name !== code && name !== "Unknown Region" && !map.has(name.toLowerCase())) map.set(name.toLowerCase(), code);
    }
  }
  nameIndex = map;
  return map;
}

// Resolves a code or English country name to an ISO alpha-2 code (or a territory code from the
// registry). Returns null when the place cannot be identified; callers must then fail closed.
export function resolvePlace(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (hcchParty(upper) || hcchTerritory(upper)) return upper;
  const byName = index().get(raw.toLowerCase());
  if (byName) return byName;
  if (/^[A-Z]{2}$/.test(upper)) {
    const name = regionNames!.of(upper);
    if (name && name !== upper && name !== "Unknown Region") return upper;
  }
  return null;
}

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

type Side = { code: string; party: string | null; inForceFrom: string | null; applies: boolean; isTerritory: boolean; name: string; note: string | null };

function side(code: string): Side {
  const territory = hcchTerritory(code);
  if (territory) {
    return { code, party: territory.party, inForceFrom: territory.appliesFrom, applies: territory.applies, isTerritory: true, name: territory.name, note: territory.note };
  }
  const party = hcchParty(code);
  if (party) return { code, party: party.iso2, inForceFrom: party.entryIntoForce, applies: true, isTerritory: false, name: party.name, note: null };
  return { code, party: null, inForceFrom: null, applies: false, isTerritory: false, name: code, note: null };
}

const DOCUMENT_PATTERNS: Record<string, RegExp> = {
  power_of_attorney_property: /power[\s_-]*of[\s_-]*attorney|\bpoa\b/i,
  prosecutor_document: /prosecut/i,
  commercial_or_customs_document: /commercial|customs|invoice|certificate[\s_-]*of[\s_-]*origin|bill[\s_-]*of[\s_-]*lading/i,
  extradition_document: /extradit/i,
};

export function evaluateApostilleRelationship(input: ApostilleRelationshipInput): ApostilleRelationship {
  const evaluationDate = input.evaluationDate ?? today();
  const originCode = resolvePlace(input.origin);
  const destinationCode = resolvePlace(input.destination);
  const base = { origin: originCode, destination: destinationCode, evaluationDate, source: HCCH_APOSTILLE_SOURCE };
  const result = (status: ApostilleRelationshipStatus, reasons: string[], effectiveFrom: string | null = null, notes: string[] = []): ApostilleRelationship =>
    ({ status, ...base, effectiveFrom, reasons, notes });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(evaluationDate) || Number.isNaN(Date.parse(evaluationDate))) {
    return result("OFFICIAL_REVIEW_REQUIRED", ["The evaluation date is not a valid date."]);
  }
  if (!originCode || !destinationCode) {
    return result("OFFICIAL_REVIEW_REQUIRED", [`The ${!originCode ? "origin" : "destination"} could not be identified as a country or territory.`]);
  }
  if (evaluationDate > addDays(HCCH_APOSTILLE_SOURCE.verifiedAt, HCCH_REGISTRY_MAX_AGE_DAYS)) {
    return result("OFFICIAL_REVIEW_REQUIRED", [`The treaty registry was last verified against the HCCH status table on ${HCCH_APOSTILLE_SOURCE.verifiedAt} and must be re-verified for this date.`]);
  }

  const a = side(originCode), b = side(destinationCode);
  if (a.party && a.party === b.party && !a.isTerritory && !b.isTerritory) {
    return result("APOSTILLE_NOT_APPLICABLE", ["The Convention applies to documents produced in another Contracting Party; origin and destination are the same State."]);
  }
  for (const s of [a, b]) {
    if (!s.party) return result("APOSTILLE_NOT_APPLICABLE", [`${s.name} is not listed as a Contracting Party on the HCCH status table verified ${HCCH_APOSTILLE_SOURCE.verifiedAt}.`]);
    if (!s.applies) return result("APOSTILLE_NOT_APPLICABLE", [`The Convention does not apply to ${s.name}. ${s.note ?? ""}`.trim()]);
  }
  for (const s of [a, b]) {
    if (s.inForceFrom === null) return result("OFFICIAL_REVIEW_REQUIRED", [`The date from which the Convention applies to ${s.name} is not established in the registry. ${s.note ?? ""}`.trim()]);
  }

  const notes: string[] = [];
  let effectiveFrom = a.inForceFrom! > b.inForceFrom! ? a.inForceFrom! : b.inForceFrom!;
  const pa = a.party!, pb = b.party!;

  const declared = HCCH_DECLARED_NON_APPLICATION.find((d) => (d.party === pa && d.counterpart === pb) || (d.party === pb && d.counterpart === pa));
  if (declared) return result("APOSTILLE_NOT_APPLICABLE", [declared.basis]);

  const objections = HCCH_OBJECTIONS.filter((x) => (x.objector === pa && x.acceding === pb) || (x.objector === pb && x.acceding === pa));
  for (const objection of objections) {
    const who = `${hcchParty(objection.objector)!.name} objected to the accession of ${hcchParty(objection.acceding)!.name}`;
    if (objection.late) {
      notes.push(`${who} after the Article 12 period expired; the depositary records that it has no legal consequences.`);
      continue;
    }
    if ((a.isTerritory || b.isTerritory) && !objection.scope) {
      return result("OFFICIAL_REVIEW_REQUIRED", [`${who}; whether that objection extends to ${a.isTerritory ? a.name : b.name} is not established in the registry.`]);
    }
    if (!objection.withdrawnEffective) {
      return result("APOSTILLE_NOT_APPLICABLE", [`${who} under Article 12(2)${objection.raised ? ` on ${objection.raised}` : ""}; the objection has not been withdrawn, so the Convention is not in force between them.`]);
    }
    if (objection.withdrawnEffective > effectiveFrom) effectiveFrom = objection.withdrawnEffective;
    notes.push(`${who}; the objection was withdrawn and the Convention entered into force between them on ${objection.withdrawnEffective}.`);
  }

  if (evaluationDate < effectiveFrom) {
    // A date still ahead of the last official verification is a scheduled entry into force; an
    // earlier one is history (the Convention simply was not in force between them on that date).
    const status = effectiveFrom > HCCH_APOSTILLE_SOURCE.verifiedAt ? "FUTURE_EFFECTIVE" : "APOSTILLE_NOT_APPLICABLE";
    return result(status, [`The Convention ${status === "FUTURE_EFFECTIVE" ? "enters" : "entered"} into force between ${a.name} and ${b.name} on ${effectiveFrom}; it ${status === "FUTURE_EFFECTIVE" ? "is" : "was"} not in force on ${evaluationDate}.`], effectiveFrom, notes);
  }

  // Kosovo is the only Contracting Party not universally recognised; Parties that exclude
  // unrecognised States by declaration need an official determination.
  const reserver = [pa, pb].find((p) => HCCH_RECOGNITION_RESERVATIONS.includes(p));
  if (reserver && (pa === "XK" || pb === "XK")) {
    return result("OFFICIAL_REVIEW_REQUIRED", [`${hcchParty(reserver)!.name} declared that the Convention does not apply with entities it does not recognise as States; its relationship with Kosovo requires official confirmation.`], effectiveFrom, notes);
  }

  if (input.documentOrigin === "SUPRANATIONAL_OR_INTERGOVERNMENTAL_ORGANISATION") {
    return result("OFFICIAL_REVIEW_REQUIRED", ["Documents issued by supranational or intergovernmental organisations have no automatic apostille route; the HCCH Working Group report of 1 December 2017 identifies candidate pathways that the relevant authority must confirm."], effectiveFrom, notes);
  }

  const documentType = String(input.documentType ?? "");
  if (documentType) {
    const limitation = HCCH_DOCUMENT_LIMITATIONS.find((l) => (l.party === pa || l.party === pb) && DOCUMENT_PATTERNS[l.category]?.test(documentType));
    if (limitation) return result("OFFICIAL_REVIEW_REQUIRED", [limitation.note], effectiveFrom, notes);
  }

  const uncontrolled = HCCH_UNCONTROLLED_TERRITORY_NOTES[pa];
  if (uncontrolled) notes.push(uncontrolled);
  for (const s of [a, b]) if (s.isTerritory && s.note) notes.push(`${s.name}: ${s.note}`);

  return result("APOSTILLE_APPLICABLE", [`The Convention has been in force between ${a.name} and ${b.name} since ${effectiveFrom}.`], effectiveFrom, notes);
}

// True when the place is a Contracting Party (or covered territory) with the Convention in force
// on the date. Membership only: it says nothing about any particular country pair.
export function isApostilleConventionInForce(place: string, date: string = today()): boolean {
  const code = resolvePlace(place);
  if (!code) return false;
  const s = side(code);
  return Boolean(s.party && s.applies && s.inForceFrom && s.inForceFrom <= date);
}
