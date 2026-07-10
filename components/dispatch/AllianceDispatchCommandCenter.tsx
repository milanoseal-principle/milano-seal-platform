"use client";

import type {
  PartnerApplication,
  DispatchJob,
  PartnerPaymentItem,
} from "@/lib/dispatch/types";
import { pendingApplicationCount } from "@/lib/dispatch/partnerApplication";
import { openJobCount } from "@/lib/dispatch/dispatchQueue";
import { totalPendingApproval, usd } from "@/lib/dispatch/partnerPaymentQueue";

const card = "rounded-2xl border border-amber-300/15 bg-black/50 p-4";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={card}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-amber-100">{value}</p>
    </div>
  );
}

export function AllianceDispatchCommandCenter({
  applications = [],
  jobs = [],
  payments = [],
  activePartners = 0,
}: {
  applications?: PartnerApplication[];
  jobs?: DispatchJob[];
  payments?: PartnerPaymentItem[];
  activePartners?: number;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Alliance Dispatch Command Center
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Independent partners · offers only
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="active_partners" value={String(activePartners)} />
        <Metric label="pending_applications" value={String(pendingApplicationCount(applications))} />
        <Metric label="open_jobs" value={String(openJobCount(jobs))} />
        <Metric label="payments_awaiting_approval" value={usd(totalPendingApproval(payments))} />
      </div>
    </section>
  );
}
