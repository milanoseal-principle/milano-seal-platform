import Link from "next/link";
import { FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Release Certificates — Milano Seal",
  robots: { index: false },
};

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDashboardAccess();
  const params = await searchParams;
  const matter = typeof params.matter === "string" ? params.matter : null;
  const deal = typeof params.deal === "string" ? params.deal : null;
  const focusedId = matter ?? deal;
  const releaseHref = focusedId
    ? `/workspace/release?matter=${encodeURIComponent(focusedId)}`
    : "/workspace/release";

  return (
    <main className="min-h-[100dvh] bg-[#060608] px-4 py-8 text-[#F4F1EA] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/[0.06] pb-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#C6A55A]/55">
            Execution · Release Evidence
          </p>
          <h1 className="mt-2 font-serif text-3xl font-light sm:text-4xl">Release Certificates</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/40">
            Release and completion certificates are evidence artifacts generated only from canonical Matter, custody, delivery and release truth. Manual certificate authorship is disabled.
          </p>
        </header>

        <section className="mt-7 grid gap-4 md:grid-cols-3" aria-label="Certificate governance">
          {[
            {
              icon: ShieldCheck,
              title: "Canonical Matter",
              copy: "Certificate identity must resolve to an existing governed Matter. Typed demo or free-form Matter truth is not accepted.",
            },
            {
              icon: LockKeyhole,
              title: "Release Authority",
              copy: "A certificate cannot authorize release. It may only project release evidence after the canonical release gate has passed.",
            },
            {
              icon: FileCheck2,
              title: "Evidence First",
              copy: "Custody, delivery and completion claims must be backed by persisted evidence before an artifact can be issued.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border border-white/[0.07] bg-black/25 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C6A55A]/15 bg-[#C6A55A]/[0.035]">
                  <Icon className="h-4 w-4 text-[#DCC47F]/75" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-serif text-xl text-white/88">{item.title}</h2>
                <p className="mt-2 text-[12px] leading-5 text-white/36">{item.copy}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-2xl border border-[#C6A55A]/14 bg-[#C6A55A]/[0.02] p-5 sm:p-6" role="status">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/58">Governed next action</p>
          <h2 className="mt-2 font-serif text-2xl text-white/90">
            Open the Release Workspace
          </h2>
          <p className="mt-2 max-w-2xl text-[12px] leading-5 text-white/38">
            Verify the same Matter&apos;s settlement-dependent release authority, custody and delivery evidence before producing or sharing any completion artifact.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={releaseHref}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#C6A55A] px-4 py-2 text-sm font-medium text-black transition duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D49B]"
            >
              {focusedId ? `Review ${focusedId}` : "Open Release Workspace"}
            </Link>
            <Link
              href="/dashboard/deals"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-white/55 transition duration-150 hover:border-[#C6A55A]/25 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A55A]/55"
            >
              Open Matters
            </Link>
          </div>
        </section>

        <p className="mt-6 font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">
          No demo certificate, local hash, QR placeholder or manually asserted completion state is produced on this route.
        </p>
      </div>
    </main>
  );
}
