import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, FilePlus2, Handshake, ShieldCheck } from "lucide-react";
import { DISPATCH_QUEUE } from "@/lib/dispatch/dispatchQueue";
import { PARTNER_VERIFICATION_RULES } from "@/lib/dispatch/partnerVerification";

const DISPATCH_ACTIONS = [
  {
    href: "/dashboard/deals",
    label: "Open Matters",
    description: "Review live Matters and route work into dispatch.",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/intake",
    label: "Create Matter",
    description: "Start a new Matter before assignment.",
    icon: FilePlus2,
  },
  {
    href: "/dashboard/alliance",
    label: "Alliance Network",
    description: "Review partner coverage and network intelligence.",
    icon: Handshake,
  },
  {
    href: "/dashboard/compliance-atlas",
    label: "Compliance Gate",
    description: "Confirm jurisdiction and execution requirements.",
    icon: ShieldCheck,
  },
] as const;

export function AllianceDispatchCommandCenter() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-[#c9a24a]/25 bg-[#0b1118] p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c9a24a]">Alliance Dispatch Network</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Dispatch Command Center</h1>
        <p className="mt-3 text-sm text-white/65">
          Partner applications, verification, Partner Passport, trust score, coverage, availability,
          assignments, completion, QA, partner payment queue, and founder approval.
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

      <div className="grid gap-4 lg:grid-cols-2">
        {DISPATCH_QUEUE.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl text-white">{item.name}</h2>
                <p className="mt-2 text-sm text-white/60">
                  {item.status} · trust {item.trustScore} · {item.nextAction}
                </p>
              </div>
              <span className="rounded-full border border-[#c9a24a]/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#f1d58b]">
                {item.coverage.join(", ")}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard/deals"
                className="rounded-lg border border-[#c9a24a]/25 bg-[#c9a24a]/10 px-3 py-2 text-xs font-semibold text-[#f1d58b] transition hover:bg-[#c9a24a]/15"
              >
                Review Matters
              </Link>
              <Link
                href="/dashboard/alliance"
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:border-[#c9a24a]/25 hover:text-white"
              >
                Open Partner Network
              </Link>
            </div>
          </div>
        ))}
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
