export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadProfessional360 } from "@/lib/professional360/read-model";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";

export const metadata = {
  title: "Professional360 — The Milano Seal™",
  robots: { index: false },
};

function date(value: string | null) {
  if (!value) return "UNKNOWN";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "UNKNOWN";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function money(value: number | null, currency: string | null) {
  if (value === null) return "UNKNOWN";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD", maximumFractionDigits: 0 }).format(value);
}

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300",
  REPEAT: "border-[#C6A55A]/25 bg-[#C6A55A]/[0.06] text-[#E4CA8C]",
  AT_RISK: "border-amber-400/25 bg-amber-400/[0.06] text-amber-200",
  PAUSED: "border-orange-400/25 bg-orange-400/[0.06] text-orange-200",
  LOST: "border-red-400/25 bg-red-400/[0.06] text-red-300",
  DEVELOPING: "border-white/10 bg-white/[0.03] text-white/50",
  UNKNOWN: "border-white/10 bg-white/[0.02] text-white/30",
};

export default async function Professional360Page() {
  await requireDashboardAccess();
  const snapshot = await loadProfessional360();

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <DashboardPageHeader
        eyebrow="Professional Network · Governed Read Model"
        title="Professional360"
        description="Professional account intelligence derived from canonical Milano Seal Matters. This is not a second CRM and does not mutate Matter, payment, RON, apostille, custody, or release truth."
      />

      {snapshot.degraded ? (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-100/70">{snapshot.warning}</div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Accounts", snapshot.totals.accounts],
          ["Active", snapshot.totals.active],
          ["Repeat", snapshot.totals.repeat],
          ["At Risk", snapshot.totals.atRisk],
          ["Lost", snapshot.totals.lost],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/30">{label}</p>
            <p className="mt-2 text-2xl font-light text-[#E4CA8C]">{value}</p>
          </div>
        ))}
      </section>

      {snapshot.accounts.length === 0 ? (
        <section className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-8 text-center">
          <p className="text-sm text-white/40">No organization-linked canonical Matter evidence is available yet.</p>
        </section>
      ) : (
        <section className="space-y-3">
          {snapshot.accounts.map((account) => (
            <article key={account.organization} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div className="min-w-0 lg:max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] ${STATUS_CLASS[account.relationshipStatus] ?? STATUS_CLASS.UNKNOWN}`}>
                      {account.relationshipStatus.replaceAll("_", " ")}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#C6A55A]/50">{account.evidenceClass}</span>
                  </div>
                  <h2 className="mt-3 font-serif text-xl text-white/80">{account.organization}</h2>
                  <p className="mt-1 text-xs text-white/35">
                    {account.contacts.length ? account.contacts.join(" · ") : "Contact evidence unavailable"}
                  </p>
                  <div className="mt-4 rounded-lg border border-[#C6A55A]/10 bg-[#C6A55A]/[0.025] p-3">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#C6A55A]/50">Next Move</p>
                    <p className="mt-2 text-[12px] leading-5 text-white/55">{account.nextMove}</p>
                  </div>
                  {account.lossReason || account.lossState ? (
                    <div className="mt-3 rounded-lg border border-red-400/15 bg-red-400/[0.035] p-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-red-300/60">Loss / Refusal Evidence</p>
                      <p className="mt-2 text-[11px] text-white/45">{account.lossState ?? "UNKNOWN"}{account.lossReason ? ` · ${account.lossReason}` : ""}</p>
                    </div>
                  ) : null}
                </div>

                <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 md:grid-cols-4 lg:max-w-2xl">
                  <Metric label="Active Matters" value={account.activeMatters} />
                  <Metric label="Completed" value={account.completedMatters} />
                  <Metric label="Verified Revenue" value={money(account.verifiedRevenue, account.revenueCurrency)} />
                  <Metric label="Last Touch" value={date(account.lastMeaningfulTouch)} />
                  <Metric label="Relationship Owner" value={account.relationshipOwner ?? "UNKNOWN"} />
                  <Metric label="Referral Evidence" value={account.referralHistoryCount ?? "UNKNOWN"} />
                  <Metric label="Countries" value={account.countries.join(", ") || "UNKNOWN"} />
                  <Metric label="Matter Types" value={account.matterTypes.join(", ") || "UNKNOWN"} />
                </div>
              </div>

              <details className="mt-4 border-t border-white/[0.05] pt-4">
                <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.16em] text-white/35 hover:text-white/60">Evidence</summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {account.evidence.map((item) => <p key={item} className="text-[11px] text-white/35">{item}</p>)}
                  {account.matters.slice(0, 8).map((matter) => (
                    <Link key={matter.id} href={`/dashboard/deals/${matter.id}`} className="text-[11px] text-[#C6A55A]/65 hover:text-[#E4CA8C]">
                      {matter.displayId} · {matter.status.replaceAll("_", " ")}
                    </Link>
                  ))}
                </div>
              </details>
            </article>
          ))}
        </section>
      )}

      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/20">Generated {snapshot.generatedAt} · canonical deals only</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
      <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/25">{label}</p>
      <p className="mt-2 break-words text-[11px] leading-4 text-white/55">{value}</p>
    </div>
  );
}
