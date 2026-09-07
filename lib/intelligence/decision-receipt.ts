export interface DecisionReceipt {
  action: string;
  why: string[];
  payment: string | null;
  blocker: string | null;
  authority: string;
  evidence: string[];
  generatedAt: string;
}

export function createDecisionReceipt(input: {
  action: string;
  reasons: Array<string | null | undefined>;
  payment?: string | null;
  blocker?: string | null;
  authority: string;
  evidence: Array<string | null | undefined>;
  generatedAt?: string;
}): DecisionReceipt {
  const why = input.reasons.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim());
  const evidence = input.evidence.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim());
  return {
    action: input.action,
    why,
    payment: input.payment ?? null,
    blocker: input.blocker ?? null,
    authority: input.authority,
    evidence,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
}

export function receiptFromCanonicalAction(input: {
  actionClass: string;
  reason: string;
  paymentStatus: string;
  matterId: string;
  state: string;
  generatedAt?: string;
}): DecisionReceipt {
  return createDecisionReceipt({
    action: input.actionClass,
    reasons: [input.reason],
    payment: input.paymentStatus,
    blocker: input.actionClass.includes("Blocked") || input.actionClass.includes("Review") || input.actionClass.includes("Exception") ? input.actionClass : null,
    authority: "Milano Operator Intelligence",
    evidence: [`Matter ${input.matterId}`, `Canonical state: ${input.state}`],
    generatedAt: input.generatedAt,
  });
}
