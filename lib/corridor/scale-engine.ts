import type { MatterEconomicsRow } from "@/lib/economics/matterEconomics";

export type CorridorScaleStatus = "SCALE" | "WATCH" | "CONSTRAINED" | "DO_NOT_SCALE";
export type FactorState = "HIGH" | "MODERATE" | "LOW" | "HEALTHY" | "LIMITED" | "CURRENT" | "STALE" | "UNKNOWN";

export interface CorridorScaleFactor {
  label: string;
  state: FactorState;
  evidence: string;
}

export interface CorridorScaleDecision {
  key: string;
  destinationCountry: string;
  documentType: string;
  matterCount: number;
  observedRevenue: number | null;
  currency: string | null;
  status: CorridorScaleStatus;
  factors: CorridorScaleFactor[];
  reasons: string[];
}

export function buildCorridorScaleDecisions(matters: MatterEconomicsRow[]): CorridorScaleDecision[] {
  const groups = new Map<string, MatterEconomicsRow[]>();
  for (const matter of matters) {
    if (!matter.destinationCountry || !matter.documentType) continue;
    const key = `${matter.destinationCountry}||${matter.documentType}`;
    groups.set(key, [...(groups.get(key) ?? []), matter]);
  }

  return [...groups.entries()].map(([key, rows]) => {
    const destinationCountry = rows[0].destinationCountry as string;
    const documentType = rows[0].documentType as string;
    const demand: FactorState = rows.length >= 5 ? "HIGH" : rows.length >= 2 ? "MODERATE" : "LOW";
    const currencies = [...new Set(rows.map((r) => r.collectedRevenue.currency).filter((v): v is string => Boolean(v)))];
    const revenueRows = rows.filter((r) => r.collectedRevenue.evidenceClass === "OBSERVED" && r.collectedRevenue.value !== null);
    const observedRevenue = currencies.length <= 1 && revenueRows.length
      ? revenueRows.reduce((sum, r) => sum + (r.collectedRevenue.value ?? 0), 0)
      : null;
    const marginKnown = rows.some((r) => r.contributionMargin.evidenceClass === "OBSERVED" && r.contributionMargin.value !== null);
    const exceptionCount = rows.filter((r) => r.exceptionObserved === true).length;
    const exceptionState: FactorState = rows.length === 0 ? "UNKNOWN" : exceptionCount === 0 ? "LOW" : exceptionCount / rows.length <= 0.15 ? "MODERATE" : "HIGH";

    const factors: CorridorScaleFactor[] = [
      { label: "Demand", state: demand, evidence: `${rows.length} canonical Matter${rows.length === 1 ? "" : "s"}.` },
      { label: "Margin", state: marginKnown ? "HEALTHY" : "UNKNOWN", evidence: marginKnown ? "Observed canonical contribution evidence exists." : "No canonical direct-cost ledger; margin is not inferred." },
      { label: "Execution capacity", state: "UNKNOWN", evidence: "No corridor-specific canonical capacity threshold is wired." },
      { label: "Partner capacity", state: "UNKNOWN", evidence: "No corridor-specific verified partner-capacity projection is wired." },
      { label: "Authority-rule freshness", state: "UNKNOWN", evidence: "Scale engine does not infer freshness from public corridor copy; authority verification remains separate." },
      { label: "Exception rate", state: exceptionState, evidence: `${exceptionCount} observed payment exception${exceptionCount === 1 ? "" : "s"} across ${rows.length} Matter${rows.length === 1 ? "" : "s"}.` },
      { label: "Professional demand", state: "UNKNOWN", evidence: "Professional360 evidence is not yet corridor-attributed strongly enough to infer demand." },
    ];

    const blockingUnknown = factors.some((f) => ["Margin", "Execution capacity", "Authority-rule freshness"].includes(f.label) && f.state === "UNKNOWN");
    let status: CorridorScaleStatus;
    const reasons: string[] = [];
    if (blockingUnknown) {
      status = demand === "LOW" ? "DO_NOT_SCALE" : "WATCH";
      reasons.push("Critical scale factors remain UNKNOWN; the engine fails closed rather than fabricating readiness.");
    } else if (exceptionState === "HIGH") {
      status = "CONSTRAINED";
      reasons.push("Observed exception burden is high.");
    } else if (demand === "HIGH") {
      status = "SCALE";
      reasons.push("Demand is high and all critical factors are evidence-backed.");
    } else {
      status = "WATCH";
      reasons.push("Evidence does not yet justify a SCALE decision.");
    }

    return {
      key,
      destinationCountry,
      documentType,
      matterCount: rows.length,
      observedRevenue,
      currency: currencies.length === 1 ? currencies[0] : null,
      status,
      factors,
      reasons,
    };
  }).sort((a, b) => b.matterCount - a.matterCount || a.destinationCountry.localeCompare(b.destinationCountry));
}
