import type {
  OriginPosture,
  ProfessionalDocumentClass,
  SignerPosture,
} from "@/lib/professional/universal-attorney-journey";

export type ProfessionalClientType = "attorney" | "advisor" | "private_client" | "unknown";

export interface ProfessionalSessionState {
  version: 1;
  destinationSlug?: string;
  documentClass?: ProfessionalDocumentClass;
  origin?: OriginPosture;
  signer?: SignerPosture;
  clientType?: ProfessionalClientType;
  questionsAnswered?: string[];
}

const STORAGE_KEY = "milano.professional-session.v1";
export const PROFESSIONAL_SESSION_EVENT = "milano:professional-session";

const DOCUMENT_CLASSES = new Set<ProfessionalDocumentClass>([
  "power_of_attorney",
  "affidavit",
  "corporate_document",
  "vital_record",
  "estate_inheritance",
  "citizenship_record",
  "real_estate_authorization",
  "federal_document",
  "other",
]);

const ORIGINS = new Set<OriginPosture>([
  "florida",
  "other_us_state",
  "federal",
  "unknown",
]);

const SIGNERS = new Set<SignerPosture>([
  "us",
  "international",
  "multiple",
  "not_applicable",
  "unknown",
]);

const CLIENT_TYPES = new Set<ProfessionalClientType>([
  "attorney",
  "advisor",
  "private_client",
  "unknown",
]);

function safeSlug(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9-]{1,80}$/.test(normalized) ? normalized : undefined;
}

function safeQuestions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const questions = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 80)
    .slice(0, 20);
  return questions.length ? Array.from(new Set(questions)) : undefined;
}

export function sanitizeProfessionalSession(value: unknown): ProfessionalSessionState {
  if (!value || typeof value !== "object") return { version: 1 };
  const candidate = value as Record<string, unknown>;
  const documentClass = DOCUMENT_CLASSES.has(candidate.documentClass as ProfessionalDocumentClass)
    ? (candidate.documentClass as ProfessionalDocumentClass)
    : undefined;
  const origin = ORIGINS.has(candidate.origin as OriginPosture)
    ? (candidate.origin as OriginPosture)
    : undefined;
  const signer = SIGNERS.has(candidate.signer as SignerPosture)
    ? (candidate.signer as SignerPosture)
    : undefined;
  const clientType = CLIENT_TYPES.has(candidate.clientType as ProfessionalClientType)
    ? (candidate.clientType as ProfessionalClientType)
    : undefined;

  return {
    version: 1,
    destinationSlug: safeSlug(candidate.destinationSlug),
    documentClass,
    origin,
    signer,
    clientType,
    questionsAnswered: safeQuestions(candidate.questionsAnswered),
  };
}

export function readProfessionalSession(): ProfessionalSessionState {
  if (typeof window === "undefined") return { version: 1 };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeProfessionalSession(JSON.parse(raw)) : { version: 1 };
  } catch {
    return { version: 1 };
  }
}

export function writeProfessionalSession(
  patch: Partial<Omit<ProfessionalSessionState, "version">>,
): ProfessionalSessionState {
  if (typeof window === "undefined") return { version: 1, ...patch } as ProfessionalSessionState;
  const next = sanitizeProfessionalSession({ ...readProfessionalSession(), ...patch, version: 1 });
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(PROFESSIONAL_SESSION_EVENT, { detail: next }));
  } catch {
    // Session continuity is an enhancement only; never block the execution journey.
  }
  return next;
}

export function markProfessionalQuestionAnswered(question: string): ProfessionalSessionState {
  const current = readProfessionalSession();
  const questionsAnswered = Array.from(
    new Set([...(current.questionsAnswered ?? []), question.trim()].filter(Boolean)),
  ).slice(0, 20);
  return writeProfessionalSession({ questionsAnswered });
}

export function clearProfessionalSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(PROFESSIONAL_SESSION_EVENT, {
        detail: { version: 1 } satisfies ProfessionalSessionState,
      }),
    );
  } catch {
    // Non-critical client storage cleanup.
  }
}
