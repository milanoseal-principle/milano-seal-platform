import mammoth from "mammoth";

export type ClaudeContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
        data: string;
      };
    }
  | {
      type: "document";
      source: {
        type: "base64";
        media_type: "application/pdf";
        data: string;
      };
    };

export interface ParsedFile {
  name: string;
  mime: string;
  size: number;
  block: ClaudeContentBlock;
  textBlock?: ClaudeContentBlock;
  ok: boolean;
  error?: string;
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const SUPPORTED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";

function bufferToBase64(buf: ArrayBuffer): string {
  const Buf: any = (globalThis as any).Buffer;
  if (Buf) return Buf.from(buf).toString("base64");
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const base = {
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
  };

  if (file.size > MAX_FILE_BYTES) {
    return {
      ...base,
      ok: false,
      error: `File exceeds ${MAX_FILE_BYTES / 1024 / 1024} MB limit`,
      block: { type: "text", text: `[Skipped ${file.name}: too large]` },
    };
  }

  try {
    if (SUPPORTED_IMAGE_MIMES.has(file.type)) {
      const buf = await file.arrayBuffer();
      return {
        ...base,
        ok: true,
        block: {
          type: "image",
          source: {
            type: "base64",
            media_type: file.type as
              | "image/jpeg"
              | "image/png"
              | "image/webp"
              | "image/gif",
            data: bufferToBase64(buf),
          },
        },
      };
    }

    if (file.type === PDF_MIME || /\.pdf$/i.test(file.name)) {
      const buf = await file.arrayBuffer();
      const docBlock: ClaudeContentBlock = {
        type: "document",
        source: {
          type: "base64",
          media_type: PDF_MIME,
          data: bufferToBase64(buf),
        },
      };

      let textBlock: ClaudeContentBlock | undefined;
      try {
        const text = await extractPdfText(Buffer.from(buf));
        if (text.trim()) {
          textBlock = {
            type: "text",
            text: `--- ${file.name} (extracted text) ---\n${text.slice(0, 16000)}`,
          };
        }
      } catch (e) {
        console.warn(
          `[fileParser] PDF text extraction failed for ${file.name}:`,
          e instanceof Error ? e.message : e,
        );
      }

      return {
        ...base,
        mime: PDF_MIME,
        ok: true,
        block: docBlock,
        textBlock,
      };
    }

    if (
      file.type === DOCX_MIME ||
      file.type === DOC_MIME ||
      /\.docx?$/i.test(file.name)
    ) {
      const buf = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer: buf });
      const text = (result.value || "").trim();
      if (!text) {
        return {
          ...base,
          ok: false,
          error: "DOCX produced no extractable text",
          block: {
            type: "text",
            text: `[${file.name}: empty after extraction]`,
          },
        };
      }
      return {
        ...base,
        ok: true,
        block: {
          type: "text",
          text: `--- ${file.name} ---\n${text}`,
        },
      };
    }

    if (file.type.startsWith("text/")) {
      const text = await file.text();
      return {
        ...base,
        ok: true,
        block: {
          type: "text",
          text: `--- ${file.name} ---\n${text}`,
        },
      };
    }

    return {
      ...base,
      ok: false,
      error: `Unsupported file type: ${file.type || "unknown"}`,
      block: {
        type: "text",
        text: `[Skipped ${file.name}: unsupported type ${file.type}]`,
      },
    };
  } catch (e) {
    return {
      ...base,
      ok: false,
      error: e instanceof Error ? e.message : "parse failed",
      block: { type: "text", text: `[Failed to parse ${file.name}]` },
    };
  }
}

export async function parseFiles(files: File[]): Promise<ParsedFile[]> {
  return Promise.all(files.map(parseFile));
}

async function extractPdfText(buf: Buffer): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    const merged = Array.isArray(text) ? text.join("\n") : String(text ?? "");
    const trimmed = merged.trim();
    if (trimmed) return trimmed;
  } catch (err) {
    console.warn(
      "[fileParser] unpdf extraction failed, trying pdf-parse:",
      err instanceof Error ? err.message : err,
    );
  }

  const mod: any = await import("pdf-parse/lib/pdf-parse.js").catch(
    () => import("pdf-parse"),
  );
  const fn = (mod.default ?? mod) as (b: Buffer) => Promise<{ text: string }>;
  const data = await fn(buf);
  return (data?.text ?? "").trim();
}
