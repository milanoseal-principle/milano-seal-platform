import type { ExecutionRoutePlan, ExecutionRouteType, OperatorSpineRisk } from "./types";

export function buildExecutionRoutePlan(input: Partial<ExecutionRoutePlan> & { originalDocs?: boolean; alliance?: boolean }): ExecutionRoutePlan {
  const routeType = input.routeType ?? getRoutePlanType(input);
  return { id: input.id ?? "route-plan-draft", title: input.title ?? "Execution Route Plan", routeType, origin: input.origin ?? "Florida", destination: input.destination ?? "Destination review required", stopLabels: input.stopLabels ?? getRoutePlanChecklist(routeType), ownerRole: input.ownerRole ?? "operator", risk: input.risk ?? getRouteRisk(routeType, input.originalDocs), status: input.alliance ? "staged" : input.status ?? "planned", notes: input.notes ?? "Receiving authority review remains required for international packet release." };
}
export function getRoutePlanType(input: Partial<ExecutionRoutePlan> & { alliance?: boolean; originalDocs?: boolean }): ExecutionRouteType { if (input.alliance) return "alliance_partner_staged"; if (input.originalDocs) return "courier_release"; return input.routeType ?? "client_signing_coordination"; }
export function getRoutePlanChecklist(route: ExecutionRouteType): readonly string[] { return ["Confirm matter review", "Confirm payment gate", "Confirm signer path", route.includes("courier") ? "Confirm custody clearance" : "Confirm route notes", "Document receiving-authority warning"]; }
export function getRoutePlanEmptyState() { return "No route plans connected yet. Create plans only after matter review and payment-gated scheduling rules are satisfied."; }
function getRouteRisk(route: ExecutionRouteType, originalDocs?: boolean): OperatorSpineRisk { if (originalDocs || route === "courier_release") return "custody_sensitive"; if (route === "alliance_partner_staged") return "compliance_sensitive"; return "medium"; }
