export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadOperatorIntelligence } from "@/lib/operator-intelligence/read-model";
import { receiptFromCanonicalAction } from "@/lib/intelligence/decision-receipt";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";

export const metadata = {
  title: "Recovery Command — The Milano Seal™",
  robots: { index: false },
};

const RECOVERY_CLASSES = new Set(["Payment Blocked", "Document Blocked", "Authority Review", "Courier Exception", "Overdue Follow-Up"]);

export default async function RecoveryPage() {
  await requireDashboardAccess();
  const snapshot = await loadOperatorIntelligence();
  const actions = snapshot.actions.filter((action) => RECOVERY_CLASSES.has(action.actionClass));

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <DashboardPageHeader
        eyebrow="Exceptions · Recovery"
        title="Matter Recovery Command"
        description="What stopped, why, and what canonical action is next. Payment, execution, authority, courier, and follow-up conditions remain separate and are never collapsed into a generic failure state."
      />

      {snapshot.degraded ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-100/70">{snapshot.warning}</div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {["Payment Blocked", "Document Blocked", "Authority Review", "Courier Exception", "Overdue Follow-Up"].map((name) => (
          <div key={name} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/25">{name}</p>
            <p className="mt-2 text-2xl font-light text-[#E4CA8C]">{snapshot.counts[name as keyof typeof snapshot.counts] ?? 0}</p>
          </div>
        ))}
      </section>

      {actions.length === 0 ? (
        <section className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-8 text-center">
          <p className="text-sm text-white/40">No recoverable condition was derived from the currently available canonical action evidence.</p>
        </section>
      ) : (
        <section className="space-y-3">
          {actions.map((action) => {
            const receipt = receiptFromCanonicalAction({
              actionClass: action.actionClass,
              reason: action.reason,
              paymentStatus: action.paymentStatus,
              matterId: action.matterId,
              state: action.state,
              generatedAt: snapshot.generatedAt,
            });
            return (
              <article key={action.id} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-[#C6A55A]/55">{action.actionClass}</p>
                    <h2 className="mt-2 text-sm font-medium text-white/70">{action.clientName}</h2>
                    <p className="mt-1 break-all font-mono text-[9px] text-white/25">{action.matterId}</p>
                    <p className="mt-3 max-w-2xl text-[12px] leading-5 text-white/45">{action.reason}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={action.matterHref} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-white/55 hover:border-[#C6A55A]/30 hover:text-white">Open Matter</Link>
                      <Link href={action.actionHref} className="rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-3 py-2 text-[10px] text-[#E4CA8C] hover:border-[#C6A55A]/40">Recovery Action</Link>
                    </div>
                  </div>

                  <div className="w-full rounded-lg border border-white/[0.06] bg-white/[0.015] p-4 lg:max-w-md">
                    <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#C6A55A]/50">Decision Receipt</p>
                    <dl className="mt-3 space-y-3 text-[11px]">
                      <ReceiptRow label="Action" value={receipt.action} />
                      <ReceiptRow label="Why" value={receipt.why.join(" · ") || "UNKNOWN"} />
                      <ReceiptRow label="Payment" value={receipt.payment ?? "UNKNOWN"} />
                      <ReceiptRow label="Blocker" value={receipt.blocker ?? "None derived"} />
                      <ReceiptRow label="Authority" value={receipt.authority} />
                      <ReceiptRow label="Evidence" value={receipt.evidence.join(" · ")} />
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">{label}</dt>
      <dd className="mt-1 leading-5 text-white/45">{value}</dd>
    </div>
  );
}
