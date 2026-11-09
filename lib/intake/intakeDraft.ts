import { z } from "zod";
import { CONCIERGE_SERVICE_INTENTS } from "@/lib/acquisition/concierge-service-intents";

export const intakeFormSchema = z.object({
  submissionOutcome: z.enum(["ready","unknown"]).optional(),
  serviceIntent: z.enum(CONCIERGE_SERVICE_INTENTS).optional(),
  serviceIntentSource: z.enum(['link','intake','default']).optional(), serviceIntentSelectedAt: z.string().max(50).optional(),
  detailStep: z.number().int().min(0).max(2).optional(), internationalUse: z.boolean().optional(),
  witnessContext: z.string().max(3000).optional(), receivingAuthority: z.string().max(1000).optional(),
  firm: z.string().max(500).optional(), professionalCountry: z.string().max(200).optional(),
  description: z.string().max(20000), name: z.string().max(500), email: z.string().max(500), phone: z.string().max(100),
  documentType: z.string().max(1000), documentCount: z.number().int().min(0).max(10000), signerCount: z.number().int().min(0).max(10000),
  originState: z.string().max(500), signerLocation: z.string().max(500), destinationCountry: z.string().max(500),
  executionType: z.enum(["", "RON", "InPerson", "None", "Unsure"]), mobileAddress: z.string().max(2000),
  notarizationChoice: z.enum(["yes", "no", "already", "unsure", ""]),
  apostilleChoice: z.enum(["yes", "no", "unsure", ""]), translationChoice: z.enum(["yes", "no", "unsure", ""]),
  deadline: z.string().max(100), courierRequired: z.boolean(),
  timelineChoice: z.enum(["", "standard", "expedited", "urgent"]),
  deliveryChoice: z.enum(["", "digital", "domestic_courier", "international_courier"]),
});
export type IntakeFormState = z.infer<typeof intakeFormSchema>;
export const intakeAnalysisSchema = z.object({
  documentType: z.string().max(1000).optional(), country: z.string().max(500).optional(), originState: z.string().max(500).optional(),
  documentCount: z.number().int().min(0).max(10000).optional(), signerCount: z.number().int().min(0).max(10000).optional(),
  apostilleRequired: z.boolean().optional(), translationNeeded: z.boolean().optional(),
});
export const INTAKE_DRAFT_KEY = "ms_intake_draft_v1";
const draftSchema = z.object({ version: z.literal(1), context: z.string(), savedAt: z.number(), step: z.union([z.literal(1), z.literal(2), z.literal(3)]), form: intakeFormSchema, analysis: intakeAnalysisSchema.nullable().optional() });

export function restoreIntakeDraft(raw: string | null, context: string, now = Date.now()) {
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw ?? "null"));
    if (!parsed.success || parsed.data.context !== context || now < parsed.data.savedAt || now - parsed.data.savedAt > 86_400_000) return null;
    return parsed.data;
  } catch { return null; }
}
