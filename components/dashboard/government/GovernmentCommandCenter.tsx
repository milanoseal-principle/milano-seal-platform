"use client";

import type { GovernmentCrmRecord, ProcurementOpportunity } from "@/lib/government/types";
import {
  countByStage,
  pipelineValue,
  awardRate,
  renewalValue,
  contractValue,
  averageProcurementCycleDays,
} from "@/lib/government/governmentCrmEngine";
import {
  filterOpenOpportunities,
} from "@/lib/government/procurementOpportunityEngine";

const card =
  "rounded-2xl border border-amber-300/15 bg-black/50 p-4";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={card}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-amber-100">{value}</p>
    </div>
  );
}

function usd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// DASHBOARD METRICS — render from supplied sample data or honest zero state.
export function GovernmentCommandCenter({
  records = [],
  opportunities = [],
  registeredAgencies = 0,
  submittedBids = 0,
  governmentRevenue = 0,
  governmentClients = 0,
}: {
  records?: GovernmentCrmRecord[];
  opportunities?: ProcurementOpportunity[];
  registeredAgencies?: number;
  submittedBids?: number;
  governmentRevenue?: number;
  governmentClients?: number;
}) {
  const stages = countByStage(records);
  const openOpps = filterOpenOpportunities(opportunities).length;
  const rate = awardRate(records);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Government Command Center
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Metric label="registered_agencies" value={String(registeredAgencies)} />
        <Metric label="open_opportunities" value={String(openOpps)} />
        <Metric label="submitted_bids" value={String(submittedBids || stages.bid_submitted)} />
        <Metric label="award_rate" value={`${Math.round(rate * 100)}%`} />
        <Metric label="contract_value" value={usd(contractValue(records))} />
        <Metric label="pipeline_value" value={usd(pipelineValue(records))} />
        <Metric label="renewal_value" value={usd(renewalValue(records))} />
        <Metric
          label="average_procurement_cycle"
          value={`${Math.round(averageProcurementCycleDays(records))}d`}
        />
        <Metric label="government_revenue" value={usd(governmentRevenue)} />
        <Metric label="government_clients" value={String(governmentClients)} />
      </div>
    </section>
  );
}
