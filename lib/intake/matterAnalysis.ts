import { buildExecutionPath } from "./executionPath";
import { isHagueMember } from "./hagueMembers";
import { quickTagParse } from "./quickTags";
import {
  getLanguageRouting,
  type CountryLanguageRouting,
} from "@/lib/hague-countries";

export type StructuringState =
  | "IDLE"
  | "DOCUMENT_RECEIVED"
  | "EXTRACTING_ENTITIES"
  | "CLASSIFYING_MATTER"
  | "CHECKING_JURISDICTION"
  | "DETECTING_APOSTILLE_REQUIREMENTS"
  | "STRUCTURING_EXECUTION_PATH"
  | "READY_FOR_REVIEW";

export const STRUCTURING_SEQUENCE: StructuringState[] = [
  "DOCUMENT_RECEIVED",
  "EXTRACTING_ENTITIES",
  "CLASSIFYING_MATTER",
  "CHECKING_JURISDICTION",
  "DETECTING_APOSTILLE_REQUIREMENTS",
  "STRUCTURING_EXECUTION_PATH",
  "READY_FOR_REVIEW",
];

export const STRUCTURING_LABEL: Record<StructuringState, string> = {
  IDLE: "Idle",
  DOCUMENT_RECEIVED: "Document Received",
  EXTRACTING_ENTITIES: "Extracting Entities",
  CLASSIFYING_MATTER: "Classifying Matter",
  CHECKING_JURISDICTION: "Checking Jurisdiction",
  DETECTING_APOSTILLE_REQUIREMENTS: "Detecting Apostille Requirements",
  STRUCTURING_EXECUTION_PATH: "Structuring Execution Path",
  READY_FOR_REVIEW: "Ready for Review",
};

export interface MatterAnalysis {
  clientName: string;
  email: string;
  phone: string;
  organization: string;

  country: string;
  documentType: string;
  documentDescription: string;
  documentCount: number;
  documentList: string[];
  signerCount: number;
  signerNames: string;
  originState: string;

  apostilleRequired: boolean;
  translationNeeded: boolean;
  urgency: "standard" | "expedited" | "urgent";
  ronReviewRequired: boolean;

  hagueMember: boolean;
  executionPath: string[];
  executionReasoning: string;

  confidenceScore: number;
  detectedFields: string[];
  missingFields: string[];

  language: string;
  translation: string;
  wasTranslated: boolean;
  aiNotes: string;

  languageRouting: CountryLanguageRouting | null;

  source: "idle" | "typing" | "ai" | "heuristic";
  structuringState: StructuringState;
}

export type MatterAnalysisPatch = Partial<MatterAnalysis>;

export function emptyAnalysis(): MatterAnalysis {
  return {
    clientName: "",
    email: "",
    phone: "",
    organization: "",
    country: "",
    documentType: "",
    documentDescription: "",
    documentCount: 1,
    documentList: [],
    signerCount: 1,
    signerNames: "",
    originState: "",
    apostilleRequired: false,
    translationNeeded: false,
    urgency: "standard",
    ronReviewRequired: false,
    hagueMember: false,
    executionPath: [],
    executionReasoning: "",
    confidenceScore: 0,
    detectedFields: [],
    missingFields: [],
    language: "",
    translation: "",
    wasTranslated: false,
    aiNotes: "",
    languageRouting: null,
    source: "idle",
    structuringState: "IDLE",
  };
}

export function mergeAnalysis(
  base: MatterAnalysis,
  patch: MatterAnalysisPatch,
): MatterAnalysis {
  const next: MatterAnalysis = { ...base, ...patch };
  next.hagueMember = isHagueMember(next.country);
  next.languageRouting = getLanguageRouting(next.country);
  const path = buildExecutionPath({
    country: next.country,
    apostilleRequired: next.apostilleRequired,
    translationNeeded: next.translationNeeded,
    ronPossible: next.ronReviewRequired,
  });
  next.executionPath = path.steps;
  next.executionReasoning = path.reasoning;
  next.detectedFields = computeDetectedFields(next);
  next.missingFields = computeMissingFields(next);
  next.confidenceScore = computeConfidence(next);
  return next;
}

export function applyQuickTags(
  base: MatterAnalysis,
  text: string,
): MatterAnalysis {
  const tagged = quickTagParse(text) as MatterAnalysisPatch;
  return mergeAnalysis(
    { ...base, source: text.trim() ? "typing" : "idle" },
    tagged,
  );
}

interface ExtractResponse {
  ok: boolean;
  extraction?: {
    client_name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    country?: string;
    document_type?: string;
    document_description?: string;
    document_count?: number;
    document_list?: string[];
    signer_count?: number;
    signer_names?: string;
    origin_state?: string;
    apostille_needed?: boolean;
    translation_needed?: boolean;
    urgency?: "standard" | "expedited" | "urgent";
    detected_language?: string;
    english_translation?: string;
    was_translated?: boolean;
    ai_notes?: string;
    confidence?: number;
    provider?: "anthropic" | "heuristic" | "none";
    missing_fields?: string[];
  };
  error?: string;
}

export interface ParseMatterArgs {
  message?: string;
  files?: File[];
}

export async function parseMatter(
  args: ParseMatterArgs,
): Promise<MatterAnalysis> {
  const fd = new FormData();
  if (args.message?.trim()) fd.append("message", args.message);
  if (args.files?.length) {
    for (const f of args.files) fd.append("files", f);
  }

  const res = await fetch("/api/intake/extract", {
    method: "POST",
    body: fd,
  });
  const json = (await res.json()) as ExtractResponse;
  if (!res.ok || !json.ok || !json.extraction) {
    throw new Error(json.error || `Parse failed (${res.status})`);
  }

  const x = json.extraction;
  const provider = x.provider === "heuristic" ? "heuristic" : "ai";
  return mergeAnalysis(emptyAnalysis(), {
    clientName: x.client_name ?? "",
    email: x.email ?? "",
    phone: x.phone ?? "",
    organization: x.organization ?? "",
    country: x.country ?? "",
    documentType: x.document_type ?? "",
    documentDescription: x.document_description ?? "",
    documentCount: Math.max(1, x.document_count ?? 1),
    documentList: x.document_list ?? [],
    signerCount: Math.max(1, x.signer_count ?? 1),
    signerNames: x.signer_names ?? "",
    originState: x.origin_state ?? "",
    apostilleRequired: Boolean(x.apostille_needed),
    translationNeeded: Boolean(x.translation_needed),
    urgency: x.urgency ?? "standard",
    ronReviewRequired: false,
    language: x.detected_language ?? "",
    translation: x.english_translation ?? "",
    wasTranslated: Boolean(x.was_translated),
    aiNotes: x.ai_notes ?? "",
    source: provider,
    structuringState: "READY_FOR_REVIEW",
  });
}

const DETECTABLE: Array<{ key: keyof MatterAnalysis; label: string }> = [
  { key: "country", label: "Country" },
  { key: "documentType", label: "Document type" },
  { key: "signerCount", label: "Signer count" },
  { key: "apostilleRequired", label: "Apostille requirement" },
  { key: "urgency", label: "Timeline" },
  { key: "documentDescription", label: "Document description" },
];

function computeDetectedFields(a: MatterAnalysis): string[] {
  const found: string[] = [];
  if (a.country) found.push("Country");
  if (a.documentType) found.push("Document type");
  if (a.signerCount > 0) found.push("Signer count");
  if (a.country) found.push("Apostille requirement");
  if (a.urgency && a.urgency !== "standard") found.push("Timeline");
  if (a.documentDescription) found.push("Document description");
  return found;
}

function computeMissingFields(a: MatterAnalysis): string[] {
  const missing: string[] = [];
  if (!a.country) missing.push("Destination country");
  if (!a.documentType) missing.push("Document type");
  if (!a.documentDescription) missing.push("Matter description");
  if (a.urgency === "standard") missing.push("Preferred execution timeline");
  return missing;
}

function computeConfidence(a: MatterAnalysis): number {
  const total = DETECTABLE.length;
  let hits = 0;
  if (a.country) hits++;
  if (a.documentType) hits++;
  if (a.signerCount > 0) hits++;
  if (a.country) hits++;
  if (a.urgency && a.urgency !== "standard") hits++;
  if (a.documentDescription) hits++;
  const ratio = hits / total;
  return Math.min(99, Math.round(ratio * 100));
}
