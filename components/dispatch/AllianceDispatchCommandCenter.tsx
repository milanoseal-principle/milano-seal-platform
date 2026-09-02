import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, FilePlus2, Handshake, ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { PARTNER_VERIFICATION_RULES } from "@/lib/dispatch/partnerVerification";

const DISPATCH_ACTIONS = [
  {
    href: "/dashboard/deals",
    label: "Open Matters",
    description: "Review live Matters and route governed work into dispatch.",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/intake",
    label: "Create Matter",
    description: "Start a canonical Matter before assignment.",
    icon: FilePlus2,
  },
  {
    href: "/dashboard/alliance",
    label: "Alliance Network",
    description: "Review partner coverage and evidence-backed network intelligence.",
    icon: Handshake,
  },
  {
    href: "/dashboard/compliance-atlas",
    label: "Compliance Gate",
    description: "Confirm jurisdiction and execution requirements before routing.",
    icon: ShieldCheck,
  },
] as const;

type DispatchRow = {
  id: string;
  status: string;
  priority: string;
  requested_service: string;
  created_at: string;
  assigned_operator_id: string | null;
  deals: {
    deal_id?: string | null;
    client_name?: string | null;
    destination_country?: string | null;
    document_type?: string | null;
  } | null;
};

const STATUS_COPY: Record<string, string> = {
  requested: "Awaiting assignment",
  offered: "Assignment offered",
  accepted: "Accepted",
  declined: "Declined — reroute required",
  reassigned: "Reassigned",
  escalated: "Escalated",
  cancelled: "Cancelled",
  completed: "Completed",
};

export async function AllianceDispatchCommandCenter() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dispatch_requests")
    .select(
      "id,status,priority,requested_service,created_at,assigned_operator_id,deals!inner(deal_id,client_name,destination_country,document_type)",
    )
    .order("created_at", { ascending: false })
    .limit(12);

  const dispatches = (data ?? []) as unknown as DispatchRow[];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-[#c9a24a]/25 bg-[#0b1118] p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c9a24a]">Alliance Dispatch Network</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Dispatch Command Center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          Canonical Matter-linked dispatch, operator eligibility, availability, assignment and completion evidence. No synthetic trust score or staged queue state is shown.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DISPATCH_ACTIONS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-[#c9a24a]/20 bg-[#0b1118] p-4 transition hover:border-[#c9a24a]/45 hover:bg-[#111923] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24a]/70"
          >
            <div className="flex items-center justify-between gap-3">
              <Icon className="h-4 w-4 text-[#f1d58b]" />
              <ArrowRight className="h-4 w-4 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-[#f1d58b]" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-white">{label}</h2>
            <p className="mt-1 text-xs leading-5 text-white/55">{description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#c9a24a]">Live Dispatch Truth</p>
            <h2 className="mt-1 text-xl text-white">Matter-linked queue</h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
            {error ? "Read unavailable" : `${dispatches.length} visible`}
          </span>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-[#E0876E]/20 bg-[#C0563E]/[0.06] p-4" role="status">
            <p className="text-sm font-medium text-[#E9A08C]">Dispatch evidence could not be loaded.</p>
            <p className="mt-1 text-xs leading-5 text-white/45">No queue state has been inferred. Refresh after database connectivity is restored.</p>
          </div>
        ) : dispatches.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-5">
            <p className="text-sm font-medium text-white/75">No governed dispatch requests.</p>
            <p className="mt-1 text-xs leading-5 text-white/45">Open a Matter and create a dispatch request when external or Alliance execution support is actually required.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {dispatches.map((item) => {
              const matter = item.deals;
              return (
                <article key={item.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#c9a24a]/80">
                        {matter?.deal_id ?? "Matter reference unavailable"}
                      </p>
                      <h3 className="mt-1 truncate text-sm font-semibold text-white">
                        {matter?.client_name ?? "Client name unavailable"}
                      </h3>
                      <p className="mt-1 text-xs text-white/45">
                        {[matter?.document_type, matter?.destination_country].filter(Boolean).join(" · ") || "Scope pending"}
                      </p>
                    </div>
                    <span className="rounded-full border border-[#c9a24a]/20 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#f1d58b]">
                      {item.priority}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">Dispatch state</p>
                      <p className="mt-1 text-xs text-white/65">{STATUS_COPY[item.status] ?? item.status}</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">Assignment</p>
                      <p className="mt-1 text-xs text-white/65">{item.assigned_operator_id ? "Operator linked" : "Unassigned"}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/45">Verification Rules</p>
        <div className="flex flex-wrap gap-2">
          {PARTNER_VERIFICATION_RULES.map((rule) => (
            <span key={rule} className="rounded-full border border-[#c9a24a]/20 px-3 py-1 text-xs text-[#f1d58b]">
              {rule}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
