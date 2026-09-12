import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Circle, FileCheck2, LockKeyhole, PackageCheck, ReceiptText, Route, ShieldCheck, Truck } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Secure Matter Command Center | The Milano Seal™",
  description:
    "Preview the Milano Seal client Matter command center: execution state, split-payment gates, Matter truth, document vault, chain of custody, courier release, and next required action.",
  alternates: { canonical: "https://themilanoseal.com/secure-portal" },
};

const EXECUTION_RAIL = [
  "Intake",
  "Review",
  "50% Deposit",
  "Schedule",
  "RON / Execution",
  "Apostille",
  "Final 50%",
  "Release",
  "International Courier",
  "Delivered",
] as const;

const PANELS = [
  { title: "Matter Truth", icon: ShieldCheck, rows: [["Document", "One and the Same Affidavit"], ["Origin", "Florida"], ["Destination", "Italy"], ["Execution", "RON / authority review"]] },
  { title: "Transaction", icon: ReceiptText, rows: [["Quote", "Matter-specific"], ["Deposit", "50% Wise verified"], ["Scheduling / RON", "Unlocked after deposit"], ["Final balance", "50% due before international release"]] },
  { title: "Document Vault", icon: FileCheck2, rows: [["Uploaded", "Visible"], ["Review", "Governed"], ["Executed", "Evidence-linked"], ["Release", "Locked until final payment clearance"]] },
  { title: "Chain of Custody", icon: Truck, rows: [["Current location", "Operator controlled"], ["Last event", "Time-stamped"], ["Next event", "Authority / payment dependent"], ["Tracking", "Available after international release"]] },
] as const;

export default function SecurePortalPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen overflow-x-hidden bg-[#050507] text-white">
        <section className="relative px-4 pb-20 sm:px-6" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 3rem)" }}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(198,165,90,0.11),transparent_32%)]" />
          <div className="relative mx-auto max-w-6xl">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--ms-gold)]/65">Secure Matter Command Center</p>
                <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">One Matter. <span className="italic text-[var(--ms-gold)]">One execution truth.</span></h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">The portal is the client projection of the governed Matter record: status, deposit gate, execution route, final-balance release gate, document state, custody, courier release, and delivery evidence.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/login?next=/portal" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/35 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ms-gold)]">Open Client Portal<ArrowRight className="h-3.5 w-3.5" /></Link>
                <Link href="/intake" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#050507]">Begin Secure Intake<ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>

            <section className="mt-12 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#09090B]/95 shadow-[0_35px_120px_rgba(0,0,0,0.55)]">
              <div className="border-b border-white/[0.07] p-5 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/55">Live Matter shell preview</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <h2 className="font-serif text-2xl sm:text-3xl">MS-2026-08-###</h2>
                      <span className="rounded-full border border-[var(--ms-gold)]/25 bg-[var(--ms-gold)]/[0.06] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--ms-gold)]">Apostille Processing</span>
                    </div>
                    <p className="mt-2 text-sm text-white/42">Florida → Italy · One and the Same Affidavit</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-200/80"><LockKeyhole className="mr-2 inline h-4 w-4" />50% deposit verified · scheduling gate satisfied</div>
                </div>
              </div>

              <div className="overflow-x-auto border-b border-white/[0.07] px-5 py-6 sm:px-7">
                <ol className="flex min-w-[1120px] items-center">
                  {EXECUTION_RAIL.map((stage, index) => {
                    const activeIndex = 5;
                    const complete = index < activeIndex;
                    const active = index === activeIndex;
                    return (
                      <li key={stage} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${complete ? "border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-300" : active ? "border-[var(--ms-gold)]/55 bg-[var(--ms-gold)]/[0.10] text-[var(--ms-gold)] shadow-[0_0_25px_rgba(198,165,90,0.18)]" : "border-white/[0.08] text-white/20"}`}>{complete ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2.5 w-2.5" />}</div>
                          <span className={`max-w-[92px] font-mono text-[8px] uppercase tracking-[0.11em] ${active ? "text-[var(--ms-gold)]" : complete ? "text-white/55" : "text-white/24"}`}>{stage}</span>
                        </div>
                        {index < EXECUTION_RAIL.length - 1 && <div className={`mx-2 h-px flex-1 ${index < activeIndex ? "bg-gradient-to-r from-emerald-500/35 to-[var(--ms-gold)]/30" : "bg-white/[0.07]"}`} />}
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="grid gap-px bg-white/[0.06] md:grid-cols-2">
                {PANELS.map(({ title, icon: Icon, rows }) => (
                  <article key={title} className="bg-[#09090B] p-5 sm:p-7">
                    <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ms-gold)]/18 bg-[var(--ms-gold)]/[0.04]"><Icon className="h-4 w-4 text-[var(--ms-gold)]/80" /></div><h3 className="font-serif text-xl">{title}</h3></div>
                    <dl className="mt-5 space-y-3">
                      {rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-white/[0.05] pb-3 last:border-0"><dt className="text-xs text-white/32">{label}</dt><dd className="text-right text-xs text-white/68">{value}</dd></div>)}
                    </dl>
                  </article>
                ))}
              </div>

              <div className="p-5 sm:p-7">
                <div className="relative overflow-hidden rounded-2xl border border-[var(--ms-gold)]/30 bg-[var(--ms-gold)]/[0.055] p-5 sm:p-6">
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[var(--ms-gold)]" />
                  <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div><p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/65">Next required action</p><h3 className="mt-2 font-serif text-xl">Await competent-authority apostille return</h3><p className="mt-2 text-sm text-white/45">Owner: Milano Seal Operations · Client action required: None</p></div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-xs text-white/45"><Route className="h-4 w-4 text-[var(--ms-gold)]" />Final 50% will gate international release</div>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[{ icon: LockKeyhole, title: "Two Payment Gates", body: "A verified 50% deposit unlocks scheduling and eligible RON/execution. The final 50% must clear before international release and shipping." }, { icon: PackageCheck, title: "Evidence-Linked", body: "Documents and release events are projected from governed Matter evidence." }, { icon: Truck, title: "Custody-Aware", body: "International courier visibility appears only after final payment clearance and real custody events." }].map(({ icon: Icon, title, body }) => <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"><Icon className="h-4 w-4 text-[var(--ms-gold)]/70" /><h3 className="mt-4 font-serif text-lg">{title}</h3><p className="mt-2 text-sm leading-6 text-white/38">{body}</p></div>)}
            </div>

            <p className="mt-10 text-xs leading-5 text-white/28">Preview data above is illustrative only. The authenticated portal displays only client-safe projections from the user’s actual Matter. Final acceptance remains subject to the receiving authority.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
