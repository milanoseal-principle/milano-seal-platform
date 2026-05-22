const KNOWN_LABELS = [
  "Power of Attorney",
  "Affidavit",
  "Marriage Certificate",
  "Birth Certificate",
  "Death Certificate",
  "Diploma / Transcript",
  "FBI Background Check",
  "Real Estate Deed",
  "Corporate Resolution",
  "Articles of Incorporation",
  "One-and-Same Affidavit",
  "Trust Document",
  "Court Order",
  "Last Will and Testament",
  "Translation Certificate",
  "Other",
] as const;

export type DocumentLabel = (typeof KNOWN_LABELS)[number];

export interface ClassifyResult {
  label: DocumentLabel | string;
  confidence: number;
  provider: "anthropic" | "openai" | "heuristic" | "none";
  raw?: unknown;
}

const SYSTEM_PROMPT = `You are a document classifier for an international notarization firm.
Given the body text of a document (or excerpt), return EXACTLY ONE label
from this list, nothing else:
${KNOWN_LABELS.join("\n")}
Pick "Other" only if no label fits.`;

function heuristic(text: string): ClassifyResult {
  const t = text.toLowerCase();
  if (/power of attorney|attorney-?in-?fact/.test(t))
    return {
      label: "Power of Attorney",
      confidence: 0.6,
      provider: "heuristic",
    };
  if (/marriage certificate/.test(t))
    return {
      label: "Marriage Certificate",
      confidence: 0.6,
      provider: "heuristic",
    };
  if (/birth certificate/.test(t))
    return {
      label: "Birth Certificate",
      confidence: 0.6,
      provider: "heuristic",
    };
  if (/death certificate/.test(t))
    return {
      label: "Death Certificate",
      confidence: 0.6,
      provider: "heuristic",
    };
  if (/affidavit/.test(t))
    return { label: "Affidavit", confidence: 0.55, provider: "heuristic" };
  if (/fbi|criminal record|background check/.test(t))
    return {
      label: "FBI Background Check",
      confidence: 0.55,
      provider: "heuristic",
    };
  if (/articles? of incorporation/.test(t))
    return {
      label: "Articles of Incorporation",
      confidence: 0.6,
      provider: "heuristic",
    };
  if (/diploma|transcript|university|college/.test(t))
    return {
      label: "Diploma / Transcript",
      confidence: 0.5,
      provider: "heuristic",
    };
  if (/last will and testament|testament/.test(t))
    return {
      label: "Last Will and Testament",
      confidence: 0.6,
      provider: "heuristic",
    };
  if (/deed|grantor|grantee/.test(t))
    return {
      label: "Real Estate Deed",
      confidence: 0.55,
      provider: "heuristic",
    };
  return { label: "Other", confidence: 0.3, provider: "heuristic" };
}

async function classifyWithAnthropic(text: string): Promise<ClassifyResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 32,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Classify the following text into one label only:\n\n${text.slice(0, 4000)}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const out = (json.content?.find((c) => c.type === "text")?.text ?? "")
    .trim()
    .replace(/^"|"$/g, "");
  return {
    label: (out || "Other") as ClassifyResult["label"],
    confidence: 0.85,
    provider: "anthropic",
    raw: json,
  };
}

async function classifyWithOpenAI(text: string): Promise<ClassifyResult> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CLASSIFIER_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Classify the following text into one label only:\n\n${text.slice(0, 4000)}`,
        },
      ],
      max_tokens: 32,
      temperature: 0,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const out = (json.choices?.[0]?.message?.content ?? "")
    .trim()
    .replace(/^"|"$/g, "");
  return {
    label: (out || "Other") as ClassifyResult["label"],
    confidence: 0.85,
    provider: "openai",
    raw: json,
  };
}

export async function classifyDocument(text: string): Promise<ClassifyResult> {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return { label: "Other", confidence: 0, provider: "none" };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await classifyWithAnthropic(trimmed);
    } catch (err) {
      console.warn(
        "[aiClassifier] Anthropic failed, falling back:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return await classifyWithOpenAI(trimmed);
    } catch (err) {
      console.warn(
        "[aiClassifier] OpenAI failed, falling back:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return heuristic(trimmed);
}
