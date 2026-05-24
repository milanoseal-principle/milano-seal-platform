import type { ClaudeContentBlock } from "./fileParser";

export interface ExtractedIntake {
  client_name: string;
  email: string;
  phone: string;
  organization: string;
  country: string;
  document_type: string;
  document_description: string;
  document_count: number;
  document_list: string[];
  signer_count: number;
  signer_names: string;
  origin_state: string;
  apostille_needed: boolean;
  translation_needed: boolean;
  urgency: "standard" | "expedited" | "urgent";
  detected_language: string;
  english_translation: string;
  was_translated: boolean;
  ai_notes: string;
  confidence: number;
  provider: "anthropic" | "gemini" | "groq" | "heuristic" | "none";
  missing_fields: string[];
}

export interface ExtractInput {
  message?: string;
  fileBlocks?: ClaudeContentBlock[];
}

const CLAUDE_MODEL =
  process.env.ANTHROPIC_INTAKE_MODEL || "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are an intake extractor for The Milano Seal — an international notarization, apostille, and document coordination firm.

You will be given a client's free-text request and (optionally) one or more attached documents. Your job is to extract a single JSON object describing the request.

Detect the language of the input. If it is not English, also produce an English translation in the "english_translation" field and set "was_translated": true.

Output ONLY a valid JSON object — no preface, no markdown fences. Use this exact shape:

{
  "client_name": string,
  "email": string,
  "phone": string,
  "organization": string,
  "country": string,                 // destination country (where the document will be used)
  "document_type": string,           // one of: "Power of Attorney", "Affidavit", "Birth Certificate", "Marriage Certificate", "Death Certificate", "Divorce Decree", "Diploma / Transcript", "Academic Transcript / Diploma", "FBI Background Check", "Criminal Record / Police Report", "Real Estate Deed", "Deed / Title Document", "Mortgage / Loan Document", "Corporate Resolution", "Articles of Incorporation", "Contract / Agreement", "Will / Testament", "Trust Document", "Court Order / Judgment", "Release / Waiver", "Passport / Identification Copy", "Name Change Document", "Immigration Filing", "Visa Support Document", "Medical Record", "Adoption Document", "One and the Same Affidavit", "Name Discrepancy Affidavit", "Other"
  "document_description": string,    // 1-2 sentence summary in ENGLISH of what the document(s) are and their purpose
  "document_count": number,          // 1+
  "document_list": string[],         // names/types of each document if multiple
  "signer_count": number,            // default 1
  "signer_names": string,            // comma-separated, may be empty
  "origin_state": string,            // U.S. state where the document originates, or "" if unknown
  "apostille_needed": boolean,
  "translation_needed": boolean,
  "urgency": "standard" | "expedited" | "urgent",
  "detected_language": string,       // e.g. "en", "es", "it", "pt", "fr"
  "english_translation": string,     // English translation of message if non-English; otherwise ""
  "was_translated": boolean,
  "ai_notes": string,                // anything noteworthy you couldn't fit above
  "confidence": number               // 0..1, how confident you are overall
}

Rules:
- Use empty string "" when a field is unknown. Use 0 / false / [] for unknown numeric/boolean/list.
- Country names should be in English title case ("Italy", "United Kingdom"). Use "United States" for documents staying domestic.
- If multiple documents are mentioned, document_count should reflect the count and document_list should list them.
- If the user mentions a deadline within ~3 days set urgency to "urgent"; within ~7 days "expedited"; otherwise "standard".
- Apostille is typically needed when the destination country is not the U.S. and is a Hague Convention member; infer when not stated.
- If the request is in Spanish, Italian, Portuguese, French, German, etc., translate the message to English in english_translation.
- ALL text fields (document_description, ai_notes, signer_names, document_list) must be written in English regardless of the input language. Never leave foreign-language text in any field other than english_translation.
- Never invent details. Only extract what is in the input.`;

const KNOWN_COUNTRIES = [
  "Italy",
  "Spain",
  "Portugal",
  "Mexico",
  "Brazil",
  "Colombia",
  "Argentina",
  "Chile",
  "Peru",
  "France",
  "Germany",
  "Greece",
  "United Kingdom",
  "Canada",
  "Australia",
  "Netherlands",
  "Switzerland",
  "Austria",
  "Japan",
  "South Korea",
  "United Arab Emirates",
  "India",
  "South Africa",
  "New Zealand",
  "Ireland",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Croatia",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Belgium",
  "Luxembourg",
  "Turkey",
  "Israel",
  "Qatar",
  "Saudi Arabia",
  "China",
  "Hong Kong",
  "Singapore",
  "United States",
];

const DOC_KEYWORDS: Array<[RegExp, string]> = [
  [/power\s*of\s*attorney|attorney-?in-?fact|poa\b/i, "Power of Attorney"],
  [/affidavit/i, "Affidavit"],
  [/marriage\s*certificate/i, "Marriage Certificate"],
  [/birth\s*certificate/i, "Birth Certificate"],
  [/death\s*certificate/i, "Death Certificate"],
  [/divorce/i, "Divorce Decree"],
  [/diploma|transcript/i, "Academic Transcript / Diploma"],
  [/fbi|background\s*check|criminal\s*record/i, "FBI Background Check"],
  [/deed|grantor|grantee|title\s*document/i, "Deed / Title Document"],
  [/mortgage|loan\s*document/i, "Mortgage / Loan Document"],
  [/articles?\s*of\s*incorporation/i, "Articles of Incorporation"],
  [/corporate\s*resolution/i, "Corporate Resolution"],
  [/contract|agreement/i, "Contract / Agreement"],
  [/will|testament/i, "Will / Testament"],
  [/trust/i, "Trust Document"],
  [/court\s*order|judgment/i, "Court Order / Judgment"],
  [/release|waiver/i, "Release / Waiver"],
  [/passport|identification/i, "Passport / Identification Copy"],
  [/immigration/i, "Immigration Filing"],
  [/visa/i, "Visa Support Document"],
  [/medical\s*record/i, "Medical Record"],
  [/adoption/i, "Adoption Document"],
];

export async function extractIntake(
  input: ExtractInput,
): Promise<ExtractedIntake> {
  const message = (input.message || "").trim();
  const fileBlocks = input.fileBlocks ?? [];

  if (!message && fileBlocks.length === 0) {
    return emptyResult("none");
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await extractWithAnthropic(message, fileBlocks);
    } catch (err) {
      console.warn(
        "[intakeExtractor] Anthropic failed, trying Groq:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      return await extractWithGroq(message, fileBlocks);
    } catch (err) {
      console.warn(
        "[intakeExtractor] Groq failed, falling back to heuristic:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return heuristicExtract(message);
}

const GROQ_MODEL = process.env.GROQ_INTAKE_MODEL || "llama-3.3-70b-versatile";

async function extractWithGroq(
  message: string,
  fileBlocks: ClaudeContentBlock[],
): Promise<ExtractedIntake> {
  const apiKey = process.env.GROQ_API_KEY!;

  const textParts: string[] = [];
  let skippedFiles = 0;

  for (const block of fileBlocks) {
    if (block.type === "text") {
      textParts.push(block.text);
    } else {
      skippedFiles++;
    }
  }

  const skippedNote =
    skippedFiles > 0
      ? `\n\n[Note: ${skippedFiles} file(s) were attached but cannot be read in text mode. Extract what you can from the message above.]`
      : "";

  const userContent = message
    ? `Client request:\n${message}${skippedNote}\n\n${textParts.join("\n\n")}\n\nReturn the JSON object now.`
    : `${textParts.join("\n\n")}${skippedNote}\n\nReturn the JSON object now.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = (json.choices?.[0]?.message?.content ?? "").trim();

  const parsed = safeParseJson(raw);
  if (!parsed) throw new Error("Groq returned non-JSON output");

  return normalize(parsed, "groq");
}

async function extractWithAnthropic(
  message: string,
  fileBlocks: ClaudeContentBlock[],
): Promise<ExtractedIntake> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;

  const userContent: ClaudeContentBlock[] = [];
  if (fileBlocks.length) userContent.push(...fileBlocks);
  userContent.push({
    type: "text",
    text: message
      ? `Client request:\n${message}\n\nReturn the JSON object now.`
      : `The client did not include a written message — extract everything possible from the attached document(s) and return the JSON object now.`,
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const raw = (json.content?.find((c) => c.type === "text")?.text ?? "").trim();

  const parsed = safeParseJson(raw);
  if (!parsed) {
    throw new Error("Claude returned non-JSON output");
  }

  return normalize(parsed, "anthropic");
}

export function heuristicExtract(message: string): ExtractedIntake {
  const out = emptyResult("heuristic");
  const text = message || "";

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) out.email = emailMatch[0];

  const phoneMatch = text.match(/(\+?\d[\d\s().-]{8,}\d)/);
  if (phoneMatch) out.phone = phoneMatch[1].trim();

  for (const c of KNOWN_COUNTRIES) {
    if (new RegExp(`\\b${escapeRegex(c)}\\b`, "i").test(text)) {
      out.country = c;
      break;
    }
  }

  for (const [pattern, label] of DOC_KEYWORDS) {
    if (pattern.test(text)) {
      out.document_type = label;
      break;
    }
  }

  if (/apostille|hague/i.test(text)) out.apostille_needed = true;

  if (/translat/i.test(text)) out.translation_needed = true;

  const signerMatch = text.match(/(\d+)\s*(?:signer|signator)/i);
  if (signerMatch) out.signer_count = Math.max(1, parseInt(signerMatch[1], 10));

  const docMatch = text.match(/(\d+)\s*(?:document|doc)s?\b/i);
  if (docMatch) out.document_count = Math.max(1, parseInt(docMatch[1], 10));

  if (/urgent|asap|immediately|today|tomorrow|same\s*day|rush/i.test(text)) {
    out.urgency = "urgent";
  } else if (/expedit|priority|this\s*week|hurry/i.test(text)) {
    out.urgency = "expedited";
  }

  if (!out.document_description && text.length > 0) {
    out.document_description = text.slice(0, 280);
  }

  out.detected_language = "en";
  out.confidence = text.length > 0 ? 0.4 : 0;
  out.missing_fields = computeMissing(out);
  return out;
}

function emptyResult(provider: ExtractedIntake["provider"]): ExtractedIntake {
  return {
    client_name: "",
    email: "",
    phone: "",
    organization: "",
    country: "",
    document_type: "",
    document_description: "",
    document_count: 1,
    document_list: [],
    signer_count: 1,
    signer_names: "",
    origin_state: "",
    apostille_needed: false,
    translation_needed: false,
    urgency: "standard",
    detected_language: "",
    english_translation: "",
    was_translated: false,
    ai_notes: "",
    confidence: 0,
    provider,
    missing_fields: [],
  };
}

function safeParseJson(text: string): Record<string, unknown> | null {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const m = stripped.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

function normalize(
  raw: Record<string, unknown>,
  provider: ExtractedIntake["provider"],
): ExtractedIntake {
  const r = raw as Record<string, unknown>;
  const str = (k: string, def = ""): string =>
    typeof r[k] === "string" ? (r[k] as string) : def;
  const num = (k: string, def: number): number => {
    const v = r[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v)))
      return Number(v);
    return def;
  };
  const bool = (k: string): boolean => Boolean(r[k]);
  const list = (k: string): string[] =>
    Array.isArray(r[k])
      ? (r[k] as unknown[]).filter((x): x is string => typeof x === "string")
      : [];

  let urgency: ExtractedIntake["urgency"] = "standard";
  const u = str("urgency").toLowerCase();
  if (u === "urgent" || u === "expedited") urgency = u;

  let confidence = num("confidence", 0.7);
  if (confidence > 1) confidence = confidence / 100;

  const out: ExtractedIntake = {
    client_name: str("client_name"),
    email: str("email"),
    phone: str("phone"),
    organization: str("organization"),
    country: str("country"),
    document_type: str("document_type"),
    document_description: str("document_description"),
    document_count: Math.max(1, Math.floor(num("document_count", 1))),
    document_list: list("document_list"),
    signer_count: Math.max(1, Math.floor(num("signer_count", 1))),
    signer_names: str("signer_names"),
    origin_state: str("origin_state"),
    apostille_needed: bool("apostille_needed"),
    translation_needed: bool("translation_needed"),
    urgency,
    detected_language: str("detected_language", "en"),
    english_translation: str("english_translation"),
    was_translated: bool("was_translated"),
    ai_notes: str("ai_notes"),
    confidence,
    provider,
    missing_fields: [],
  };

  out.missing_fields = computeMissing(out);
  return out;
}

function computeMissing(r: ExtractedIntake): string[] {
  const missing: string[] = [];
  if (!r.client_name) missing.push("client_name");
  if (!r.email) missing.push("email");
  if (!r.country) missing.push("country");
  if (!r.document_type) missing.push("document_type");
  return missing;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
