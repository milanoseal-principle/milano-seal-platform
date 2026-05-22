export interface OcrResult {
  text: string;
  confidence: number;
  language: string;
  blocks: number;
}

export interface OcrOptions {
  language?: string;

  verbose?: boolean;
}

type OcrInput = string | Buffer | Uint8Array | ArrayBuffer;

export async function extractText(
  input: OcrInput,
  opts: OcrOptions = {},
): Promise<OcrResult> {
  const language = opts.language ?? "eng";

  let tesseract: typeof import("tesseract.js");
  try {
    tesseract = await import("tesseract.js");
  } catch (err) {
    throw new Error(
      "tesseract.js is not installed. Run: npm install tesseract.js",
    );
  }

  let payload: unknown;
  if (typeof input === "string") {
    payload = input;
  } else if (typeof Buffer !== "undefined" && input instanceof Uint8Array) {
    payload = Buffer.from(input);
  } else if (input instanceof ArrayBuffer) {
    payload = input;
  } else {
    payload = input;
  }

  const result = await tesseract.recognize(
    payload as Parameters<typeof tesseract.recognize>[0],
    language,
    {
      logger: opts.verbose
        ? (m: { status: string; progress: number }) =>
            console.log(`[ocr] ${m.status} ${(m.progress * 100).toFixed(0)}%`)
        : undefined,
    },
  );

  const data = (
    result as { data: { text: string; confidence: number; blocks?: unknown[] } }
  ).data;
  return {
    text: (data.text ?? "").trim(),
    confidence: Math.round(data.confidence ?? 0),
    language,
    blocks: Array.isArray(data.blocks) ? data.blocks.length : 0,
  };
}
