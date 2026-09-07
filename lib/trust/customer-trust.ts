import "server-only";

import { loadOperatorIntelligence } from "@/lib/operator-intelligence/read-model";
import { loadMatterEconomics } from "@/lib/economics/matterEconomics";
import { loadProfessional360 } from "@/lib/professional360/read-model";

export type TrustEvidenceClass = "OBSERVED" | "ATTRIBUTED" | "UNKNOWN";

export interface TrustMetric {
  label: string;
  value: number | null;
  evidenceClass: TrustEvidenceClass;
  evidence: string;
}

export interface CustomerTrustStage {
  stage: "intake" | "review" | "payment" | "scheduling" | "execution" | "apostille_authentication" | "custody_release" | "completion";
  metrics: TrustMetric[];
}

export interface CustomerTrustSnapshot {
  generatedAt: string;
  degraded: boolean;
  warning: string | null;
  stages: CustomerTrustStage[];
}

const unknown = (label: string, evidence: string): TrustMetric => ({ label, value: null, evidenceClass: "UNKNOWN", evidence });
const observed = (label: string, value: number, evidence: string): TrustMetric => ({ label, value, evidenceClass: "OBSERVED", evidence });

export async function loadCustomerTrust(): Promise<CustomerTrustSnapshot> {
  const [operator, economics, professional] = await Promise.all([
    loadOperatorIntelligence(),
    loadMatterEconomics(),
    loadProfessional360(),
  ]);

  const stages: CustomerTrustStage[] = [
    {
      stage: "intake",
      metrics: [unknown("Clarification burden", "No canonical clarification-burden counter is wired."), unknown("Abandoned intake", "No governed abandoned-intake projection is wired to this read model.")],
    },
    {
      stage: "review",
      metrics: [observed("Document blockers", operator.counts["Document Blocked"], "Canonical Operator Intelligence action class."), observed("Authority reviews", operator.counts["Authority Review"], "Canonical Operator Intelligence action class.")],
    },
    {
      stage: "payment",
      metrics: [observed("Payment blockers", operator.counts["Payment Blocked"], "Canonical Operator Intelligence action class."), observed("Observed payment exceptions", economics.matters.filter((m) => m.exceptionObserved === true).length, "Canonical payment status evidence only.")],
    },
    {
      stage: "scheduling",
      metrics: [observed("Scheduling due", operator.counts["Scheduling Due"], "Canonical scheduling action class."), unknown("Time to schedule", "No canonical completed scheduling-duration projection is wired.")],
    },
    {
      stage: "execution",
      metrics: [unknown("No-show / execution failure", "No governed aggregate distinguishes all execution failure reasons in this read model."), unknown("KBA failure", "No canonical KBA failure aggregate is wired here.")],
    },
    {
      stage: "apostille_authentication",
      metrics: [observed("Apostille pending", operator.counts["Apostille Pending"], "Canonical Operator Intelligence action class."), unknown("Authority rejection rate", "Authority rejection evidence is not yet aggregated into a canonical rate.")],
    },
    {
      stage: "custody_release",
      metrics: [observed("Courier exceptions", operator.counts["Courier Exception"], "Canonical Operator Intelligence action class."), observed("Release ready", operator.counts["Release Ready"], "Canonical Operator Intelligence action class.")],
    },
    {
      stage: "completion",
      metrics: [unknown("CSAT", "No canonical CSAT ledger is wired."), unknown("Client review rate", "Review-request evidence is not equivalent to a completed review."), { label: "Repeat professional accounts", value: professional.totals.repeat, evidenceClass: "ATTRIBUTED", evidence: "Professional360 repeat-account projection; not a client satisfaction score." }],
    },
  ];

  const warnings = [operator.degraded ? operator.warning : null, economics.degraded ? economics.warning : null, professional.degraded ? professional.warning : null].filter(Boolean);
  return { generatedAt: new Date().toISOString(), degraded: warnings.length > 0, warning: warnings.join(" · ") || null, stages };
}
