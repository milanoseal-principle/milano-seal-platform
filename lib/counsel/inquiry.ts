import { z } from "zod";

export const inquirySchema = z
  .object({
    request_id: z.string().uuid(),
    intent: z.enum(["execution_review", "question"]),
    full_name: z.string().trim().min(2, "Enter your name.").max(160),
    firm: z.string().trim().min(1, "Enter your firm or organization.").max(240),
    country: z.string().trim().min(2, "Enter your country.").max(100),
    email: z
      .string()
      .trim()
      .email("Enter a valid professional email.")
      .max(254),
    destination: z.string().trim().max(100).default(""),
    summary: z
      .string()
      .trim()
      .min(10, "Please add a little more detail (at least 10 characters).")
      .max(4000),
    attribution: z
      .record(z.string(),z.string().max(4000))
      .default({})
      .transform(cleanCounselAttribution),
  })
  .superRefine((value, ctx) => {
    if (value.intent === "execution_review" && !value.destination)
      ctx.addIssue({
        code: "custom",
        path: ["destination"],
        message: "Enter the destination country.",
      });
  });
export type CounselInquiry = z.infer<typeof inquirySchema>;
export const MAX_COUNSEL_FILE = 4 * 1024 * 1024;
export function documentError(file: { size: number; type: string }) {
  if (!file.size) return "The document is empty.";
  if (file.size > MAX_COUNSEL_FILE)
    return "Choose a document smaller than 4 MB.";
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type))
    return "Choose a PDF, JPEG or PNG document.";
  return null;
}
export function counselAttribution(params: URLSearchParams) {
  const result: Record<string, string> = {};
  for (const key of [
    "source",
    "medium",
    "landing_page",
    "practice_area",
    "corridor",
    "audience",
    "campaign",
    "content",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
  ]) {
    const value = params.get(key)?.trim();
    if (value) result[key] = value.slice(0, 500);
  }
  return result;
}
export function counselHref(
  destination?: string,
  context: Record<string, string> = {},
) {
  const params = new URLSearchParams(
    counselAttribution(new URLSearchParams(context)),
  );
  if (destination) params.set("destination", destination);
  return `/counsel${params.size ? `?${params}` : ""}${destination || params.size ? "#inquiry" : ""}`;
}

export function cleanCounselAttribution(raw: Record<string, string>) {
  const safe = counselAttribution(new URLSearchParams(raw));
  if (raw.canonical_first_touch) {
    try {
      const parsed = JSON.parse(raw.canonical_first_touch);
      const allowed = [
        "landingPage",
        "source",
        "medium",
        "campaign",
        "content",
        "country",
        "document",
        "language",
        "intent",
        "capturedAt",
      ];
      const touch = Object.fromEntries(
        allowed
          .filter((key) => typeof parsed?.[key] === "string")
          .map((key) => [key, parsed[key].slice(0, 500)]),
      );
      if (Object.keys(touch).length)
        safe.canonical_first_touch = JSON.stringify(touch);
    } catch {
      /* Invalid observational context supplies no authority. */
    }
  }
  return safe;
}
export function safeCounselFilename(name: string) {
  return (
    name
      .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
      .trim()
      .slice(0, 200) || "document"
  );
}

/** Network/persistence errors do not prove that storage upload failed. */
export function confirmedUploadFailure(code: unknown): boolean {
  return code === "UPLOAD_FAILED" || code === "PRIVATE_STORAGE_UNAVAILABLE";
}
