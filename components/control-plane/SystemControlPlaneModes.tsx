"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CANONICAL_AUTHORITIES, DELIVERY_STATUSES, PARENT_SYSTEMS, SYSTEM_LABELS, type DeliveryStatus, type ParentSystem } from "@/lib/control-plane/systemRegistry";
import { FULL_SYSTEM_REGISTRY } from "@/lib/control-plane/hardeningRegistry";
import { ARCHITECTURE_DECISIONS, CAPABILITY_OWNERSHIP, DEPENDENCY_GRAPH, ENVIRONMENT_DEPENDENCIES, TECHNICAL_DEBT, WEBHOOK_REGISTRY, detectDependencyCycles } from "@/lib/control-plane/architectureGovernance";
import { AUTHORITY_EVIDENCE_REGISTRY, DOCUMENT_ORIGIN_ROUTING_MATRIX, evaluateAuthorityFreshness, summarizeHagueCoverage } from "@/lib/international-execution/operationalGovernance";

export type ControlPlaneMode = "EXECUTIVE" | "CTO" | "OPERATOR";

const SYSTEM_DESCRIPTIONS: Record<ParentSystem, string> = {
  demand: "Authority, SEO, professional/referral acquisition and secure entry into Matter intake.",
  matter_control: "Canonical Matter truth, pricing, Wise, scheduling, RON/execution, apostille/authentication, custody, delivery and release.",
  execution_network: "Operator, VA and Alliance execution capacity with governed eligibility, certification and proof.",
  intelligence_control: "Read-only reconciliation, exceptions, trust, provenance, return and system intelligence over canonical evidence.",
  governance_platform: "Supabase, auth/RLS, Vercel, validators, SOP, architecture decisions, technical debt and production certification.",
};

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</div><div className="mt-2 text-2xl font-semibold text-white">{value}</div>{detail ? <div className="mt-1 text-xs text-white/45">{detail}</div> : null}</div>;
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="space-y-4"><div><div className="text-[11px] uppercase tracking-[0.2em] text-[var(--ms-gold)]">{eyebrow}</div><h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2></div>{children}</section>;
}

export function SystemControlPlaneModes({ runtimeSha, environment }: { runtimeSha: string; environment: string }) {
  const [mode, setMode] = useState<ControlPlaneMode>("OPERATOR");
  const [query, setQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState<ParentSystem | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");
  const coverage = summarizeHagueCoverage();
  const staleAuthorities = AUTHORITY_EVIDENCE_REGISTRY.filter((record) => ["STALE", "MISSING_SOURCE", "MISSING_VERIFICATION", "REVIEW_REQUIRED"].includes(evaluateAuthorityFreshness(record))).length;
  const cycles = detectDependencyCycles();
  const statusCounts = DELIVERY_STATUSES.reduce<Record<string, number>>((acc, status) => { acc[status] = FULL_SYSTEM_REGISTRY.filter((entry) => entry.status === status).length; return acc; }, {});

  const filteredRegistry = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FULL_SYSTEM_REGISTRY.filter((entry) => {
      if (systemFilter !== "all" && entry.parentSystem !== systemFilter) return false;
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (!q) return true;
      return [entry.id, entry.name, entry.route ?? "", ...entry.sourcePaths, ...entry.authorityIds, ...entry.dependencies, ...entry.validation].join(" ").toLowerCase().includes(q);
    });
  }, [query, systemFilter, statusFilter]);

  return <main className="space-y-8 pb-16">
    <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#0d0d0d] p-6 md:p-8">
      <div className="text-xs uppercase tracking-[0.24em] text-[var(--ms-gold)]">The Milano Seal™ · System Control Plane</div>
      <h1 className="mt-3 max-w-5xl text-3xl font-semibold text-white md:text-4xl">International Document Execution OS</h1>
      <p className="mt-4 max-w-5xl text-sm leading-7 text-white/65 md:text-base">One canonical Matter system governing RON, mobile/in-person execution, state apostille, federal authentication, non-Hague legalization, translation, custody, international courier, delivery and release. Intelligence remains derived; receiving-authority acceptance remains controlling.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["EXECUTIVE", "CTO", "OPERATOR"] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.12em] ${mode === item ? "border-[var(--ms-gold)] bg-[var(--ms-gold)]/10 text-[var(--ms-gold)]" : "border-white/10 text-white/50 hover:text-white"}`}>{item}</button>)}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Runtime SHA" value={runtimeSha === "Runtime SHA unavailable" ? "UNAVAILABLE" : runtimeSha.slice(0, 8)} detail={environment.toUpperCase()} />
        <Metric label="Registered Capabilities" value={FULL_SYSTEM_REGISTRY.length} />
        <Metric label="HCCH Contracting Parties" value={coverage.contractingParties} detail="Matter-specific applicability still required" />
        <Metric label="Authority Review Queue" value={staleAuthorities} detail="stale/missing/review evidence" />
      </div>
    </section>

    {mode === "EXECUTIVE" ? <ExecutiveView coverage={coverage} statusCounts={statusCounts} /> : null}
    {mode === "CTO" ? <CtoView query={query} setQuery={setQuery} systemFilter={systemFilter} setSystemFilter={setSystemFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} filteredRegistry={filteredRegistry} cycles={cycles} /> : null}
    {mode === "OPERATOR" ? <OperatorView staleAuthorities={staleAuthorities} runtimeSha={runtimeSha} /> : null}
  </main>;
}

function ExecutiveView({ coverage, statusCounts }: { coverage: ReturnType<typeof summarizeHagueCoverage>; statusCounts: Record<string, number> }) {
  return <div className="space-y-8">
    <Section eyebrow="Platform Architecture" title="Five systems. One transaction truth.">
      <div className="grid gap-4 lg:grid-cols-5">{PARENT_SYSTEMS.map((system) => <article key={system} className="rounded-2xl border border-white/10 bg-[#111] p-5"><div className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ms-gold)]">{SYSTEM_LABELS[system]}</div><p className="mt-3 text-sm leading-6 text-white/60">{SYSTEM_DESCRIPTIONS[system]}</p></article>)}</div>
    </Section>
    <Section eyebrow="Transaction Flow" title="From intake to international release">
      <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">{["Client / Professional", "Secure Intake", "Quote / Wise", "Execution / RON", "Apostille / Authentication", "Translation / Custody", "International Delivery", "Completion / Return"].map((item, i) => <div key={item} className="rounded-xl border border-white/8 bg-black/25 p-4 text-sm text-white/65"><span className="mr-2 text-[var(--ms-gold)]">{i + 1}.</span>{item}</div>)}</div>
    </Section>
    <Section eyebrow="International Coverage" title={`${coverage.contractingParties}-party Hague network, governed per Matter`}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Mapped Destinations" value={coverage.mappedDestinations} /><Metric label="Officially Verified" value={coverage.verified} /><Metric label="Review / Incomplete" value={coverage.reviewRequired + coverage.incompleteEvidence} /><Metric label="Non-Hague" value={coverage.nonHague} /></div>
      <p className="text-sm leading-6 text-white/45">{coverage.contractingParties} Contracting Parties is a Convention coverage fact, not an automatic apostille promise. Operative relationship, document origin, competent authority, territorial scope and receiving authority control each Matter.</p>
    </Section>
    <Section eyebrow="Moat" title="Why the operating system compounds">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">{["Authority Content", "International Routing Knowledge", "Execution Network", "Matter History", "Compliance Evidence", "SOP / Process IP"].map((item) => <div key={item} className="rounded-xl border border-white/8 bg-[#111] p-4 text-sm font-medium text-white/75">{item}</div>)}</div>
    </Section>
    <Section eyebrow="Readiness" title="Evidence-based delivery status">
      <div className="grid gap-3 sm:grid-cols-4 xl:grid-cols-8">{DELIVERY_STATUSES.map((status) => <Metric key={status} label={status.replaceAll("_", " ")} value={statusCounts[status] ?? 0} />)}</div>
    </Section>
  </div>;
}

function CtoView({ query, setQuery, systemFilter, setSystemFilter, statusFilter, setStatusFilter, filteredRegistry, cycles }: { query: string; setQuery: (v: string) => void; systemFilter: ParentSystem | "all"; setSystemFilter: (v: ParentSystem | "all") => void; statusFilter: DeliveryStatus | "all"; setStatusFilter: (v: DeliveryStatus | "all") => void; filteredRegistry: typeof FULL_SYSTEM_REGISTRY; cycles: string[][] }) {
  return <div className="space-y-8">
    <Section eyebrow="Architecture Health" title="Registry, dependencies, ownership and permanent decisions">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Authorities" value={CANONICAL_AUTHORITIES.length} /><Metric label="Dependency Edges" value={DEPENDENCY_GRAPH.length} /><Metric label="Dependency Cycles" value={cycles.length} /><Metric label="ADRs" value={ARCHITECTURE_DECISIONS.length} /><Metric label="Technical Debt" value={TECHNICAL_DEBT.length} /></div>
    </Section>
    <Section eyebrow="Registry Explorer" title="Search the entire operating system">
      <div className="grid gap-3 md:grid-cols-3"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search capability, route, source, authority, validator…" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[var(--ms-gold)]" /><select value={systemFilter} onChange={(e) => setSystemFilter(e.target.value as ParentSystem | "all")} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"><option value="all">All parent systems</option>{PARENT_SYSTEMS.map((s) => <option key={s} value={s}>{SYSTEM_LABELS[s]}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | "all")} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"><option value="all">All statuses</option>{DELIVERY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      <div className="grid gap-3 xl:grid-cols-2">{filteredRegistry.map((entry) => <article key={entry.id} className="rounded-2xl border border-white/8 bg-[#0e0e0e] p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs uppercase tracking-[0.14em] text-[var(--ms-gold)]">{SYSTEM_LABELS[entry.parentSystem]}</div><div className="mt-1 text-lg font-semibold text-white">{entry.name}</div></div><div className="text-xs font-semibold text-white/50">{entry.status}</div></div><p className="mt-2 text-sm leading-6 text-white/55">{entry.purpose}</p><div className="mt-3 grid gap-1 text-xs text-white/40"><div>Authority: {entry.authorityIds.join(", ")}</div><div>Write: {entry.mutationPolicy}</div><div>Owner: {entry.owner}</div><div>Sources: {entry.sourcePaths.join(", ")}</div><div>Validators: {entry.validation.join(", ")}</div></div>{entry.route ? <Link href={entry.route} className="mt-3 inline-flex text-xs text-[var(--ms-gold)]">{entry.route} →</Link> : null}</article>)}</div>
    </Section>
    <Section eyebrow="Governance" title="Architecture decisions, external dependencies and webhooks">
      <div className="grid gap-3 xl:grid-cols-2">{ARCHITECTURE_DECISIONS.map((adr) => <article key={adr.id} className="rounded-xl border border-white/8 bg-black/25 p-4"><div className="flex justify-between gap-3"><div className="font-medium text-white">{adr.id} · {adr.title}</div><div className="text-xs text-[var(--ms-gold)]">{adr.status}</div></div><p className="mt-2 text-sm leading-6 text-white/55">{adr.decision}</p></article>)}</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{ENVIRONMENT_DEPENDENCIES.map((dep) => <div key={dep.id} className="rounded-xl border border-white/8 bg-[#111] p-4"><div className="font-medium text-white">{dep.provider}</div><div className="mt-1 text-xs text-[var(--ms-gold)]">{dep.status}</div><div className="mt-2 text-xs text-white/40">{dep.environmentVariables.join(", ")}</div></div>)}</div>
      <div className="text-xs text-white/35">Webhook registry: {WEBHOOK_REGISTRY.length} governed inbound provider surface(s). Ownership mappings: {CAPABILITY_OWNERSHIP.length}.</div>
    </Section>
  </div>;
}

function OperatorView({ staleAuthorities, runtimeSha }: { staleAuthorities: number; runtimeSha: string }) {
  const critical = [
    { label: "Matter Truth / Reconciliation", value: "OPEN", href: "/dashboard/reconciliation", note: "Canonical discrepancy queue" },
    { label: "Authority Review", value: String(staleAuthorities), href: "/dashboard/compliance-atlas", note: "stale/missing/review evidence" },
    { label: "Wise Payment", value: "GOVERNED", href: "/dashboard/payments", note: "settlement is canonical payment truth" },
    { label: "Execution", value: "GATED", href: "/dashboard/operator-spine", note: "no second Matter engine" },
    { label: "Release", value: "FAIL-CLOSED", href: "/workspace/release", note: "payment + execution + custody evidence" },
  ];
  return <div className="space-y-8">
    <Section eyebrow="What requires attention?" title="Operator system health first">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{critical.map((item) => <Link href={item.href} key={item.label} className="rounded-2xl border border-white/10 bg-[#111] p-5 hover:border-[var(--ms-gold)]/40"><div className="text-xs uppercase tracking-[0.13em] text-white/35">{item.label}</div><div className="mt-2 text-xl font-semibold text-white">{item.value}</div><div className="mt-2 text-xs text-white/45">{item.note}</div></Link>)}</div>
    </Section>
    <Section eyebrow="What is true?" title="Current governed operating posture">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Metric label="Production SHA" value={runtimeSha === "Runtime SHA unavailable" ? "UNAVAILABLE" : runtimeSha.slice(0, 8)} /><Metric label="Payment Authority" value="WISE" /><Metric label="Matter Engine" value="ONE" /><Metric label="Intelligence" value="DERIVED" /></div>
    </Section>
    <Section eyebrow="International Execution" title="Routing matrices and evidence controls">
      <div className="grid gap-3 md:grid-cols-3"><Metric label="Authority Records" value={AUTHORITY_EVIDENCE_REGISTRY.length} /><Metric label="Document Origin Classes" value={DOCUMENT_ORIGIN_ROUTING_MATRIX.length} /><Metric label="Receiving Authority" value="MATTER-SPECIFIC" detail="country route never overrides specific evidence" /></div>
    </Section>
  </div>;
}
