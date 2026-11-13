import Link from "next/link";
import { ReceivingRequirementsPanel } from "@/components/dashboard/authorities/ReceivingRequirementsPanel";

export const dynamic = "force-dynamic";

// Source-verified requirements of one receiving authority. Access is enforced by the dashboard
// layout and again by the API the panel reads.
export default async function ReceivingAuthorityRequirementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="space-y-7 pb-16">
      <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#0d0d0d] p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.22em] text-[var(--ms-gold)]">Authority Operations · Receiving requirements</div>
        <h1 className="mt-3 text-2xl font-semibold text-white md:text-3xl">What this authority requires</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
          Each requirement is recorded from the receiving authority or official guidance, with its source and a review date. A requirement with no current source is unknown, and an unknown blocks the final route. Nothing here establishes that the authority will accept a particular document.
        </p>
        <Link href="/dashboard/authorities/verify" className="mt-4 inline-flex text-xs font-medium text-[var(--ms-gold)]">← Back to authority evidence</Link>
      </section>
      <ReceivingRequirementsPanel authorityId={id} />
    </main>
  );
}
