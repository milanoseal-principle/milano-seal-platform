import Link from "next/link";
import {
  CANONICAL_AUTHORITIES,
  CONTROL_PLANE_GOVERNANCE,
  DELIVERY_STATUSES,
  PARENT_SYSTEMS,
  SYSTEM_LABELS,
  SYSTEM_REGISTRY,
  getRegistryBySystem,
  type DeliveryStatus,
} from "@/lib/control-plane/systemRegistry";
import {
  APOSTILLE_CONVENTION_PROFILE,
  INTERNATIONAL_CONTROL_DOMAINS,
  INTERNATIONAL_EXECUTION_GOVERNANCE,
  INTERNATIONAL_EXECUTION_LANES,
  INTERNATIONAL_MATTER_FACTS,
} from "@/lib/control-plane/internationalDocumentExecutionProfile";
import { assertSystemRegistryIntegrity } from "@/lib/control-plane/placementGate";

export const metadata = {
  title: "System Control Plane — The Milano Seal™",
  robots: { index: false, follow: false },
};

const SYSTEM_DESCRIPTIONS = {
  demand: "How international document-execution business enters Milano Seal: public authority, Hague/country/document education, professional channels, referrals and governed intake entry points.",
  matter_control: "The canonical operational brain: document identity, origin, destination, receiving authority, RON/notarial execution, pricing, Wise payment, scheduling, apostille/authentication, custody, courier and release.",
  execution_network: "Who performs and supports international execution: operator, VA, Alliance partners, RON/notarial capacity, translation coordination, courier and scoped external execution support.",
  intelligence_control: "Read-mostly interpretation of canonical international Matter evidence: exceptions, route reconciliation, authority freshness, trust, relationship, revenue and return intelligence.",
  governance_platform: "The safety and deployment layer: Supabase, auth/RLS, Vercel, Wise, authority provenance, validators, SOP, brand, certification and the Control Plane itself.",
} as const;

const WORKSPACES = [
  { name: "Public", route: "/", purpose: "International document education, country/document authority, professional acquisition and secure entry into Matter intake.", authority: "No private Matter access and no destination-only legal conclusions." },
  { name: "Client", route: "/portal", purpose: "Owned Matter status, required documents, payment, execution timeline, apostille/authentication progress, tracking and completed history.", authority: "Client-owned Matter scope only." },
  { name: "Operator", route: "/dashboard", purpose: "Today, Matters, RON/execution, apostille/authentication, Intelligence, Finance, Network, Growth and System governance.", authority: "Governed operator authority with final-truth review obligations." },
  { name: "VA", route: "/va/dashboard", purpose: "Assigned operational work, missing-input follow-up and proof collection.", authority: "No finance, route-approval or release authority." },
  { name: "Alliance", route: "/alliance/dashboard", purpose: "Partner profile, compliance/capacity, assigned execution, instructions and proof submission.", authority: "Scoped partner execution only." },
] as const;

function countStatuses() {
  return DELIVERY_STATUSES.reduce<Record<DeliveryStatus, number>>((acc, status) => {
    acc[status] = SYSTEM_REGISTRY.filter((entry) => entry.status === status).length;
    return acc;
  }, {} as Record<DeliveryStatus, number>);
}

export default function SystemControlPlanePage() {
  const integrity = assertSystemRegistryIntegrity();
  const statusCounts = countStatuses();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? "Runtime SHA unavailable";
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

  return (
    <main className="space-y-8 pb-16">
      <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#0d0d0d] p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-[var(--ms-gold)]">Milano Seal System Control Plane</div>
        <h1 className="mt-3 max-w-5xl text-3xl font-semibold text-white md:text-4xl">
          One international document-execution OS. Five parent systems. One canonical Matter truth.
        </h1>
        <p className="mt-4 max-w-5xl text-sm leading-7 text-white/65 md:text-base">
          The Milano Seal™ is purpose-built for international document execution, Remote Online Notarization, apostille/authentication coordination, receiving-authority review, custody, courier release and cross-border delivery. Every capability must map back to the same governed Matter instead of becoming a disconnected report or engine.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Registered capabilities" value={String(SYSTEM_REGISTRY.length)} />
          <Metric label="Canonical authorities" value={String(CANONICAL_AUTHORITIES.length)} />
          <Metric label="Execution lanes" value={String(INTERNATIONAL_EXECUTION_LANES.length)} />
          <Metric label="HCCH Apostille Convention" value={`${APOSTILLE_CONVENTION_PROFILE.contractingParties} parties`} />
          <Metric label="Registry integrity" value={integrity.valid ? "PASS" : "FAIL"} />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-xs leading-5 text-white/50">
            <span className="font-semibold text-white/70">Convention governance:</span> {APOSTILLE_CONVENTION_PROFILE.governanceNote}
          </div>
          <div className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 font-mono text-xs text-white/50">
            {environment.toUpperCase()} · SHA: {sha}
          </div>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Domain Model" title="Purpose-built international document execution controls" />
        <p className="mt-3 max-w-5xl text-sm leading-7 text-white/55">
          This is not a generic CRM or generic workflow platform. The Control Plane explicitly separates document origin, destination-country status, notarial execution, RON suitability, state/federal apostille or authentication routing, translation, receiving-authority review, custody and international courier evidence.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INTERNATIONAL_CONTROL_DOMAINS.map((domain) => (
            <article key={domain.id} className="rounded-2xl border border-white/10 bg-[#111111] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ms-gold)]">{domain.label}</div>
              <p className="mt-3 text-sm leading-6 text-white/60">{domain.truth}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Execution Lanes" title="RON, apostille, authentication and release stay distinct" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {INTERNATIONAL_EXECUTION_LANES.map((lane) => (
            <article key={lane.id} className="rounded-2xl border border-white/10 bg-[#101010] p-5">
              <h3 className="text-base font-semibold text-white">{lane.label}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{lane.purpose}</p>
              <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ms-gold)]">Canonical inputs</div>
              <p className="mt-2 text-xs leading-5 text-white/40">{lane.canonicalInputs.join(" · ")}</p>
              <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">Fail closed when</div>
              <p className="mt-2 text-xs leading-5 text-white/40">{lane.failClosedWhen.join(" · ")}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Matter Contract" title="International execution facts every Matter can require" />
        <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
          {INTERNATIONAL_MATTER_FACTS.map((fact) => (
            <span key={fact} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
              {fact.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Architecture" title="The five systems that explain everything" />
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          {PARENT_SYSTEMS.map((system) => (
            <article key={system} className="rounded-2xl border border-white/10 bg-[#111111] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ms-gold)]">{SYSTEM_LABELS[system]}</div>
              <p className="mt-3 text-sm leading-6 text-white/60">{SYSTEM_DESCRIPTIONS[system]}</p>
              <div className="mt-4 text-xs text-white/35">{getRegistryBySystem(system).length} registered capabilities</div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="User Model" title="Present the software by workspace, not by module" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {WORKSPACES.map((workspace) => (
            <article key={workspace.name} className="rounded-2xl border border-white/10 bg-[#101010] p-5">
              <div className="text-lg font-semibold text-white">{workspace.name}</div>
              <p className="mt-2 text-sm leading-6 text-white/60">{workspace.purpose}</p>
              <p className="mt-3 text-xs leading-5 text-white/40">{workspace.authority}</p>
              <Link href={workspace.route} className="mt-4 inline-flex text-sm font-medium text-[var(--ms-gold)] hover:text-white">
                Open workspace →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Truth Model" title="Canonical sources of truth" />
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.14em] text-white/40">
                <tr><th className="px-4 py-3">Domain</th><th className="px-4 py-3">Authority</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Source</th></tr>
              </thead>
              <tbody className="divide-y divide-white/8 bg-[#0d0d0d]">
                {CANONICAL_AUTHORITIES.map((authority) => (
                  <tr key={authority.id}>
                    <td className="px-4 py-3 font-medium text-white">{authority.domain}</td>
                    <td className="px-4 py-3 text-white/65">{authority.authority}</td>
                    <td className="px-4 py-3 text-[var(--ms-gold)]">{authority.mode.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white/40">{authority.sourcePath ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Readiness" title="Standardized delivery states" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          {DELIVERY_STATUSES.map((status) => <Metric key={status} label={status.replaceAll("_", " ")} value={String(statusCounts[status])} />)}
        </div>
        <p className="mt-3 text-xs leading-5 text-white/40">
          BUILT, WIRED, GATED and DEPLOYED never imply LIVE_PROVEN or CERTIFIED. Real RON identity/KBA evidence, Wise settlement, apostille/authentication completion, carrier delivery evidence and human Final Truth Review remain independent acceptance gates.
        </p>
      </section>

      <section>
        <SectionHeading eyebrow="Registry" title="Every governed capability has one place" />
        <div className="mt-4 space-y-6">
          {PARENT_SYSTEMS.map((system) => (
            <div key={system} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 md:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><div className="text-xs uppercase tracking-[0.16em] text-[var(--ms-gold)]">{SYSTEM_LABELS[system]}</div><h2 className="mt-1 text-xl font-semibold text-white">{SYSTEM_DESCRIPTIONS[system]}</h2></div>
                <div className="text-xs text-white/35">{getRegistryBySystem(system).length} entries</div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-2">
                {getRegistryBySystem(system).map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-white/8 bg-black/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-white">{entry.name}</div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ms-gold)]">{entry.status}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/55">{entry.purpose}</p>
                    <div className="mt-3 grid gap-2 text-xs text-white/40 sm:grid-cols-2">
                      <div><span className="text-white/60">Type:</span> {entry.category.replaceAll("_", " ")}</div>
                      <div><span className="text-white/60">Write:</span> {entry.mutationPolicy.replaceAll("_", " ")}</div>
                      <div><span className="text-white/60">Users:</span> {entry.audiences.join(", ")}</div>
                      <div><span className="text-white/60">Owner:</span> {entry.owner}</div>
                      <div className="sm:col-span-2"><span className="text-white/60">Authority:</span> {entry.authorityIds.join(", ")}</div>
                      <div className="sm:col-span-2"><span className="text-white/60">Validation:</span> {entry.validation.join(", ")}</div>
                    </div>
                    {entry.route ? <Link href={entry.route} className="mt-3 inline-flex text-xs font-medium text-[var(--ms-gold)] hover:text-white">{entry.route} →</Link> : null}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Build Governance" title="System Placement Gate" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            "Choose exactly one of the five parent systems.",
            "Name the user and canonical authority before code exists.",
            "For execution logic, declare document origin, destination and receiving-authority dependencies.",
            "Declare read-only versus governed mutation explicitly.",
            "Search the registry for an equivalent capability before adding anything.",
            "Place the capability inside an existing workspace whenever possible.",
            "Attach at least one production validator or test.",
            "Never infer RON, apostille, notarial act, live proof or certification from incomplete facts.",
          ].map((rule, index) => (
            <div key={rule} className="rounded-xl border border-white/8 bg-[#111111] p-4 text-sm leading-6 text-white/60"><span className="mr-2 text-[var(--ms-gold)]">{index + 1}.</span>{rule}</div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--ms-gold)]/15 bg-[var(--ms-gold)]/5 p-5 md:p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[var(--ms-gold)]">International execution locks</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(INTERNATIONAL_EXECUTION_GOVERNANCE).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-white/8 bg-black/20 p-4">
              <div className="text-xs text-white/45">{key.replaceAll(/([A-Z])/g, " $1")}</div>
              <div className="mt-2 text-sm font-semibold text-white">{value ? "LOCKED" : "OFF"}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--ms-gold)]/15 bg-[var(--ms-gold)]/5 p-5 md:p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[var(--ms-gold)]">Permanent platform locks</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(CONTROL_PLANE_GOVERNANCE).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-white/8 bg-black/20 p-4">
              <div className="text-xs text-white/45">{key.replaceAll(/([A-Z])/g, " $1")}</div>
              <div className="mt-2 text-sm font-semibold text-white">{value ? "LOCKED" : "OFF"}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><div className="text-xs uppercase tracking-[0.2em] text-[var(--ms-gold)]">{eyebrow}</div><h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/8 bg-black/25 p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-white/35">{label}</div><div className="mt-2 text-lg font-semibold text-white">{value}</div></div>;
}
