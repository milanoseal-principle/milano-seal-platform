export class RuleViolation extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "RuleViolation";
    this.code = code;
  }
}

export interface EnforceableDeal {
  id?: string;
  deal_id?: string | null;
  status?: string | null;
  signed_by?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  delivery_status?: string | null;
  payment_status?: string | null;
}

export function enforceRules(
  deal: EnforceableDeal,
  targetStatus?: string,
): true {
  const status = (targetStatus ?? deal.status ?? "").toLowerCase();

  if (status === "completed") {
    if (!deal.signed_by) {
      throw new RuleViolation(
        "Cannot complete a matter without a signature record.",
        "NO_SIGNATURE",
      );
    }
    if (deal.delivery_status && deal.delivery_status !== "delivered") {
      throw new RuleViolation(
        `Cannot complete: delivery_status is "${deal.delivery_status}".`,
        "NOT_DELIVERED",
      );
    }
  }

  if (status === "shipped") {
    if (!deal.tracking_number) {
      throw new RuleViolation(
        "Cannot ship without a tracking number.",
        "NO_TRACKING",
      );
    }
    if (!deal.carrier) {
      throw new RuleViolation("Cannot ship without a carrier.", "NO_CARRIER");
    }
  }

  if (status === "scheduled" && deal.payment_status !== "paid") {
    throw new RuleViolation(
      "Cannot schedule execution before payment is received.",
      "PAYMENT_REQUIRED",
    );
  }

  return true;
}

export function checkRules(
  deal: EnforceableDeal,
  targetStatus?: string,
): { ok: true } | { ok: false; code: string; message: string } {
  try {
    enforceRules(deal, targetStatus);
    return { ok: true };
  } catch (err) {
    if (err instanceof RuleViolation) {
      return { ok: false, code: err.code, message: err.message };
    }
    return {
      ok: false,
      code: "UNKNOWN",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
