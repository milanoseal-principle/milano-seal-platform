import { EXECUTION_METHODS, normalizeExecutionTruth, type CanonicalExecutionTruth, type ExecutionMethod } from "./executionTruth";

/** Public preferences are recorded separately; they never confirm execution. */
export function customerExecutionPreference(input: Record<string, unknown>): ExecutionMethod {
  const nested = input.execution_truth && typeof input.execution_truth === "object" && !Array.isArray(input.execution_truth)
    ? input.execution_truth as Record<string, unknown> : {};
  const value = input.customer_execution_preference ?? input.execution_method ?? nested.execution_method;
  if (typeof value === "string" && (EXECUTION_METHODS as readonly string[]).includes(value)) return value as ExecutionMethod;
  if (input.ron_required === true) return "ron";
  if (input.mobile === true) return "mobile";
  return "review_required";
}

export function provisionalExecutionTruth(input: CanonicalExecutionTruth): CanonicalExecutionTruth {
  return normalizeExecutionTruth({ signer_location: input.signer_location, execution_location: input.execution_location });
}
