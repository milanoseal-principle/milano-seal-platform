import { DESTINATIONS, type Destination } from "@/data/destinations";
import {
  PENDING_APOSTILLE_CONVENTION_DESTINATION_SLUGS,
  PROFESSIONAL_DESTINATION_EXTENSIONS,
} from "@/data/professional-destination-extensions";

export type ProfessionalRole =
  | "international_attorney"
  | "law_firm"
  | "fiduciary"
  | "family_office"
  | "corporate_advisor"
  | "private_client_advisor";

export type ProfessionalDocumentClass =
  | "power_of_attorney"
  | "affidavit"
  | "corporate_document"
  | "vital_record"
  | "estate_inheritance"
  | "citizenship_record"
  | "real_estate_authorization"
  | "federal_document"
  | "other";

export type OriginPosture = "florida" | "other_us_state" | "federal" | "unknown";

export type SignerPosture =
  | "us"
  | "international"
  | "multiple"
  | "not_applicable"
  | "unknown";

export type ReadinessStatus =
  | "MISSING_INFORMATION"
  | "ROUTE_IDENTIFIED"
  | "REVIEW_REQUIRED"
  | "READY_FOR_INTAKE";

export interface AttorneyJourneyInput {
  destinationSlug?: string;
  documentClass?: ProfessionalDocumentClass;
  origin?: OriginPosture;
  signer?: SignerPosture;
  receivingAuthority?: string;
}

export interface AttorneyJourneyResult {
  destination: Destination | null;
  status: ReadinessStatus;
  completed: number;
  total: number;
  routeLabel: string;
  routeSteps: string[];
  confirmed: string[];
  reviewRequired: string[];
  attorneyRetains: string[];
  milanoCoordinates: string[];
  intakeHref: string;
}

export const PROFESSIONAL_DOCUMENT_OPTIONS: Array<{
  value: ProfessionalDocumentClass;
  label: string;
}> = [
  { value: "power_of_attorney", label: "Power of Attorney" },
  { value: "affidavit", label: "Affidavit" },
  { value: "corporate_document", label: "Corporate Document" },
  { value: "vital_record", label: "Vital Record" },
  { value: "estate_inheritance", label: "Estate / Inheritance" },
  { value: "citizenship_record", label: "Citizenship Record" },
  { value: "real_estate_authorization", label: "Real Estate Authorization" },
  { value: "federal_document", label: "Federal Document" },
  { value: "other", label: "Other" },
];

/**
 * Destination data has accumulated historical rows over time. Professional UX
 * must resolve exactly one authority record per slug. Later rows intentionally
 * win so a newer, more specific jurisdiction record supersedes an older row
 * without creating a second professional workflow.
 *
 * The additive extension registry closes the foreign Convention-party coverage
 * gap without mutating the legacy destination dataset used by other modules.
 */
export const CANONICAL_PROFESSIONAL_DESTINATIONS = Array.from(
  [...DESTINATIONS, ...PROFESSIONAL_DESTINATION_EXTENSIONS].reduce((bySlug, destination) => {
    bySlug.set(destination.slug, destination);
    return bySlug;
  }, new Map<string, Destination>()).values(),
);

export function isPendingApostilleConventionDestination(destination?: Destination | null) {
  return Boolean(
    destination &&
      PENDING_APOSTILLE_CONVENTION_DESTINATION_SLUGS.has(destination.slug),
  );
}

/**
 * Backward-compatible export name used throughout the existing professional UX.
 * It now means every governed foreign Apostille Convention destination exposed to
 * professionals, including Thailand and Viet Nam while their Convention entry into
 * force is pending. Pending destinations fail closed to interim route review and do
 * not receive an operative apostille instruction.
 */
export const HAGUE_PROFESSIONAL_DESTINATIONS = CANONICAL_PROFESSIONAL_DESTINATIONS.filter(
  (destination) =>
    destination.hague ||
    PENDING_APOSTILLE_CONVENTION_DESTINATION_SLUGS.has(destination.slug),
).sort((a, b) => b.demand - a.demand || a.name.localeCompare(b.name));

export const PROFESSIONAL_CONVENTION_DESTINATIONS = HAGUE_PROFESSIONAL_DESTINATIONS;

export function getProfessionalDestination(slug?: string) {
  if (!slug) return null;
  return CANONICAL_PROFESSIONAL_DESTINATIONS.find((destination) => destination.slug === slug) ?? null;
}

export function getProfessionalDocumentLabel(value?: ProfessionalDocumentClass) {
  return PROFESSIONAL_DOCUMENT_OPTIONS.find((item) => item.value === value)?.label ?? "Document";
}

export function getProfessionalOriginLabel(origin?: OriginPosture) {
  switch (origin) {
    case "florida":
      return "Florida";
    case "other_us_state":
      return "U.S. state / territory";
    case "federal":
      return "U.S. federal authority";
    default:
      return "U.S. origin to be confirmed";
  }
}

function buildRoute(
  destination: Destination,
  documentClass?: ProfessionalDocumentClass,
  origin?: OriginPosture,
) {
  const doc = getProfessionalDocumentLabel(documentClass);
  const routeSteps: string[] = [
    `${doc} execution-readiness review`,
    "Applicable notarization / certification review",
  ];

  if (isPendingApostilleConventionDestination(destination)) {
    routeSteps.push("Convention entry-into-force / interim authentication route review");
  } else if (origin === "federal") {
    routeSteps.push("Competent federal authentication / apostille authority review");
  } else if (destination.hague) {
    routeSteps.push(
      origin === "florida"
        ? "Florida apostille authority review"
        : "Competent U.S. state apostille authority review",
    );
  } else {
    routeSteps.push("Authentication / consular route review");
  }

  routeSteps.push("International release");
  routeSteps.push(`Receiving authority in ${destination.name}`);
  return routeSteps;
}

export function buildAttorneyJourney(input: AttorneyJourneyInput): AttorneyJourneyResult {
  const destination = getProfessionalDestination(input.destinationSlug);
  const completed = [
    Boolean(destination),
    Boolean(input.documentClass),
    Boolean(input.origin && input.origin !== "unknown"),
    Boolean(input.signer && input.signer !== "unknown"),
  ].filter(Boolean).length;
  const total = 4;

  const confirmed: string[] = [];
  const reviewRequired: string[] = [];

  if (destination) {
    confirmed.push(`Destination selected: ${destination.name}`);
    if (isPendingApostilleConventionDestination(destination)) {
      confirmed.push("Apostille Convention party identified; entry into force is still pending");
      reviewRequired.push("Current Convention entry-into-force / interim authentication posture");
    } else {
      confirmed.push(
        destination.hague
          ? "Hague Convention route identified"
          : "Destination requires non-Hague route review",
      );
    }
  }
  if (input.documentClass) {
    confirmed.push(`Document class identified: ${getProfessionalDocumentLabel(input.documentClass)}`);
  }
  if (input.origin && input.origin !== "unknown") {
    confirmed.push(`Origin posture identified: ${getProfessionalOriginLabel(input.origin)}`);
  }
  if (input.signer && input.signer !== "unknown") {
    confirmed.push("Signer posture identified");
  }

  if (!destination) reviewRequired.push("Destination country");
  if (!input.documentClass) reviewRequired.push("Document class");
  if (!input.origin || input.origin === "unknown") {
    reviewRequired.push("Document origin / issuing authority");
  }
  if (!input.signer || input.signer === "unknown") {
    reviewRequired.push("Signer location / posture");
  }

  if (destination && completed === total) {
    reviewRequired.push("Document-specific execution requirements");
    reviewRequired.push("Receiving-authority requirements");
    reviewRequired.push("Translation / witness / format requirements when applicable");
  }

  let status: ReadinessStatus = "MISSING_INFORMATION";
  if (destination) status = "ROUTE_IDENTIFIED";
  if (destination && completed === total) status = "REVIEW_REQUIRED";
  if (destination && completed === total && input.receivingAuthority?.trim()) {
    status = "READY_FOR_INTAKE";
  }

  const routeSteps = destination
    ? buildRoute(destination, input.documentClass, input.origin)
    : [];

  const params = new URLSearchParams({
    lane: "professional",
    source: "universal-attorney-journey",
  });
  if (destination) {
    params.set("destination", destination.slug);
    params.set("country", destination.name);
  }
  if (input.documentClass) params.set("document_type", input.documentClass);
  if (input.origin) params.set("origin", input.origin);
  if (input.signer) params.set("signer_posture", input.signer);
  if (input.receivingAuthority?.trim()) {
    params.set("receiving_authority", input.receivingAuthority.trim());
  }

  return {
    destination,
    status,
    completed,
    total,
    routeLabel: destination
      ? `${getProfessionalOriginLabel(input.origin)} → ${destination.name}`
      : "Select a destination to structure the route",
    routeSteps,
    confirmed,
    reviewRequired,
    attorneyRetains: [
      "Legal advice and strategy",
      "Document substance and legal sufficiency",
      "Choice of legal instrument",
      "Receiving-authority legal judgment",
    ],
    milanoCoordinates: [
      "U.S. execution-readiness review",
      "Notarization / certification coordination",
      "Apostille or authentication routing",
      "Controlled document custody",
      "Courier and international release coordination",
      "Operational Matter status",
    ],
    intakeHref: `/intake?${params.toString()}`,
  };
}

export function validateProfessionalJourneyCoverage() {
  return HAGUE_PROFESSIONAL_DESTINATIONS.map((destination) => {
    const result = buildAttorneyJourney({
      destinationSlug: destination.slug,
      documentClass: "power_of_attorney",
      origin: "florida",
      signer: "us",
      receivingAuthority: "Professional receiving authority",
    });

    return {
      slug: destination.slug,
      name: destination.name,
      valid:
        result.destination?.slug === destination.slug &&
        result.routeSteps.length >= 4 &&
        result.status === "READY_FOR_INTAKE" &&
        result.intakeHref.includes(`destination=${encodeURIComponent(destination.slug)}`),
    };
  });
}
