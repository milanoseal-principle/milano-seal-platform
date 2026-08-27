import Link from "next/link";
import {
  EXPANSION_GOVERNANCE,
  EXPANSION_MODULES,
} from "@/lib/expansion/institutionalExpansion";

export const metadata = {
  title: "Institutional Expansion — The Milano Seal™",
  robots: { index: false, follow: false },
};

const MODULES = [
  {
    key: "execution_reconciliation",
    title: "Execution Reconciliation Center",
    summary: "Reconciles Matter, Wise payment, execution, authority, apostille, custody, courier, delivery, release and close evidence without creating a second Matter engine.",
    href: "/dashboard/deals",
    status: "BUILT",
  },
  {
    key: "truth_failure_alerts",
    title: "Truth-Failure Alert Center",
    summary: "Converts canonical reconciliation contradictions into operator-visible critical alerts. Alerts never mutate payment, scheduling, release or Matter state.",
    href: "/dashboard/command-center",
    status: "BUILT",
  },
  {
    key: "operator_knowledge_graph",
    title: "Operator Knowledge Graph",
    summary: "Builds explicit evidence edges between clients, Matters, destination countries, document types and Alliance records. No relationship is inferred from silence.",
    href: "/dashboard/operator-spine",
    status: "BUILT",
  },
  {
    key: "client_return_engine",
    title: "Client Return Engine",
    summary: "Creates a return signal only from prior completed Matter evidence and preserves canonical pricing, intake and execution review on every new Matter.",
    href: "/dashboard/deals",
    status: "BUILT",
  },
  {
    key: "trust_engine_2",
    title: "Trust Engine 2.0",
    summary: "Derives evidence status from verified authority, identity, execution, custody and delivery signals. No invented trust percentages, rankings or guarantees.",
    href: "/dashboard/compliance-atlas",
    status: "BUILT",
  },
  {
    key: "alliance_intelligence",
    title: "Advanced Alliance Intelligence",
    summary: "Evaluates dispatch eligibility from explicit active status, compliance, capacity and open exceptions. No uncontrolled payout or synthetic partner ranking logic.",
    href: "/alliance/dashboard",
    status: "BUILT",
  },
] as const;

if (MODULES.length !== EXPANSION_MODULES.length) {
  throw new Error("Institutional expansion module registry drifted.");
}

export default function InstitutionalExpansionPage() {
  return (
    <main className="space-y-8 pb-16">
      <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#101010] p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-[var(--ms-gold)]">Institutional Expansion Layer</div>
        <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Next-Generation Milano Seal OS</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-white/65 md:text-base">
          Six governed expansion engines now sit above the canonical Matter, payment, execution, authority, custody and Alliance systems. This layer is read-only by default and cannot self-certify live transaction evidence.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => (
          <article key={module.key} className="rounded-2xl border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ms-gold)]">{module.status}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">Governed projection</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">{module.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">{module.summary}</p>
            <Link href={module.href} className="mt-5 inline-flex text-sm font-medium text-[var(--ms-gold)] hover:text-white">
              Open canonical surface →
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">Governance Locks</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(EXPANSION_GOVERNANCE).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-white/8 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-white/40">{key.replaceAll(/([A-Z])/g, " $1")}</div>
              <div className="mt-2 text-sm font-semibold text-white">{value ? "LOCKED" : "OFF"}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--ms-gold)]/15 bg-[var(--ms-gold)]/5 p-5 text-sm leading-6 text-white/70">
        Live Vercel READY evidence, real Wise settlement, TIFF production Matter execution, authenticated physical role sessions, provider delivery proof and Final Truth Review remain separate certification gates and are not marked complete by this expansion layer.
      </section>
    </main>
  );
}
