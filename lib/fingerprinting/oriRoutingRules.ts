export interface OriRoutingRule {
  oriRequired: boolean;
  oriProvided: boolean;
  blockSubmission: boolean;
  note: string;
}

export function evaluateOriRouting(input: {
  oriRequired: boolean;
  oriProvided: boolean;
}): OriRoutingRule {
  const blockSubmission = input.oriRequired && !input.oriProvided;
  return {
    oriRequired: input.oriRequired,
    oriProvided: input.oriProvided,
    blockSubmission,
    note: blockSubmission
      ? "ORI missing — manual review required and submission blocked."
      : "ORI requirement satisfied or not applicable.",
  };
}
