export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireDashboardAccess } from "@/lib/dashboardAuth";

interface PageProps {
  searchParams: Promise<{
    matter?: string;
    deal?: string;
    focus?: string;
  }>;
}

function focusedHref(
  base: string,
  matter: string | null,
  deal: string | null,
) {
  const params = new URLSearchParams();
  if (matter) params.set("matter", matter);
  if (deal) params.set("deal", deal);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export default async function WorkspaceReleasePage({ searchParams }: PageProps) {
  await requireDashboardAccess();
  const params = await searchParams;
  const matter = params.matter?.trim() || null;
  const deal = params.deal?.trim() || null;

  const cards = [
    {
      eyebrow: "Releases",
      title: "Release Desk",
      description: "Canonical final-payment, packet, label and transit release queues.",
      href: focusedHref("/dashboard/releases", matter, deal),
    },
    {
      eyebrow: "Certificates",
      title: "Release Certificates",
      description: "Verification and certificate evidence for governed release.",
      href: focusedHref("/dashboard/releases/certificates", matter, deal),
    },
    {
      eyebrow: "Courier",
      title: "Courier & Custody Control",
      description: "Live carrier, tracking and shipment exception intelligence.",
      href: focusedHref("/dashboard/courier", matter, deal),
    },
    {
      eyebrow: "Review",
      title: "Needs Review Queue",
      description: "Resolve authority, document or shipment blockers before release.",
      href: focusedHref("/dashboard/needs-review", matter, deal),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <section className="rounded-lg border border-[#1A1A1A] bg-[#080808] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C6A55A]/50">
              Release Workspace
            </p>
            <h1 className="mt-1 text-2xl font-light text-white/80" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
              Release QA
            </h1>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Operator-only pre-release verification and packet quality assurance.
            </p>
          </div>

          {(matter || deal) && (
            <Link
              href="/workspace/release"
              className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55 hover:border-[#C6A55A]/30"
            >
              Clear Matter Focus
            </Link>
          )}
        </div>

        {(matter || deal) && (
          <div className="mt-5 rounded-lg border border-[#C6A55A]/15 bg-[#C6A55A]/[0.03] px-4 py-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#C6A55A]/50">
              Focused Matter
            </p>
            <p className="mt-1 break-all font-mono text-[10px] text-white/45">
              {deal ?? matter}
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] p-5 transition-colors hover:border-[#C6A55A]/20"
          >
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#C6A55A]/50">
              {card.eyebrow}
            </p>
            <p className="text-sm text-white/70 transition-colors group-hover:text-white">
              {card.title}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-white/30">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/20">
        Client portal release views remain client-role isolated. Operator release control stays inside dashboard/workspace routes.
      </p>
    </div>
  );
}
