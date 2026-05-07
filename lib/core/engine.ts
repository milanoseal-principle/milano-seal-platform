import { classifyDocument } from "@/lib/aiClassifier";
import { validateDeal, ComplianceError } from "@/lib/complianceValidator";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { runAutomation, AutomationDeal } from "@/lib/automation";
import { audit } from "@/lib/audit";

export interface EngineDeal extends AutomationDeal {
  id?: string;
  raw_text?: string | null;
  document_type?: string | null;
  destination_country?: string | null;
  country?: string | null;
  service_type?: string | null;
  mobile?: boolean | null;
  signers?: number | null;
  witnesses?: number | null;
}

export interface EngineResult {
  success: boolean;
  document_label?: string;
  classification_provider?: string;
  rules?: Record<string, unknown> | null;
  compliance_error?: { code: string; message: string };
  ledger_hash?: string | null;
  errors: { step: string; message: string }[];
}

export interface EngineOptions {
  strict?: boolean;
  skipClassification?: boolean;
  skipAutomation?: boolean;
}

export async function runDealEngine(
  deal: EngineDeal,
  opts: EngineOptions = {},
): Promise<EngineResult> {
  const result: EngineResult = {
    success: true,
    rules: null,
    errors: [],
  };

  if (
    !opts.skipClassification &&
    !deal.document_type &&
    typeof deal.raw_text === "string" &&
    deal.raw_text.trim().length > 0
  ) {
    try {
      const c = await classifyDocument(deal.raw_text);
      deal.document_type = c.label;
      result.document_label = c.label;
      result.classification_provider = c.provider;
    } catch (err) {
      result.errors.push({
        step: "classify",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    const rules = validateDeal(deal);
    result.rules = rules as unknown as Record<string, unknown>;
  } catch (err) {
    if (err instanceof ComplianceError) {
      result.compliance_error = { code: err.code, message: err.message };
      if (opts.strict) throw err;
    } else {
      result.errors.push({
        step: "compliance",
        message: err instanceof Error ? err.message : String(err),
      });
      if (opts.strict) throw err;
    }
  }

  if (deal.id) {
    try {
      const led = await appendLedger({
        deal_id: deal.id,
        event: CUSTODY_EVENTS.DOC_RECEIVED,
        actor_type: "system",
        location: "Milano Seal Intake",
        method: "ingest",
        status: "in_possession",
        metadata: {
          document_type: deal.document_type ?? null,
          country: deal.destination_country ?? deal.country ?? null,
          deal_code: deal.deal_id ?? null,
        },
      });
      result.ledger_hash = led?.hash ?? null;
    } catch (err) {
      result.errors.push({
        step: "ledger",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!opts.skipAutomation) {
    try {
      await runAutomation(deal);
    } catch (err) {
      result.errors.push({
        step: "automation",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  result.success = result.errors.length === 0;

  void audit({
    event: "engine.run",
    resource: deal.id ? `deal:${deal.id}` : null,
    payload: {
      classified: !!result.document_label,
      compliance_ok: !result.compliance_error,
      errors: result.errors.length,
    },
  });

  return result;
}
