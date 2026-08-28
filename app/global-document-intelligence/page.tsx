import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2, Map, Search, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { GlobalIntelligenceWorkspace } from "@/components/global-intelligence/GlobalIntelligenceWorkspace";

const canonical = "https://www.themilanoseal.com/global-document-intelligence";

export const metadata: Metadata = {
  title: "Global Document Intelligence | The Milano Seal™",
  description:
    "Explore governed destination, apostille, authentication, receiving-authority, and U.S. document-execution intelligence before structuring an international Matter.",
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Global Document Intelligence | The Milano Seal™",
    description:
      "Review destination corridors and U.S. execution pathways through one governed global intelligence workspace.",
    url: canonical,
    siteName: "The Milano Seal™",
    type: "website",
  },
};

export default async function GlobalDocumentIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; country?: string }>;
}) {
  const params = await searchParams;
  const initialView = params.view === "map" ? "map" : "directory";

  return (
    <PublicShell>
      <main
        className="min-h-screen overflow-x-hidden bg-[#060606] text-white"
        style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}
      >
        <section className="relative overflow-hidden border-b border-white/[0.055] px-4 py-16 sm:px-6 md:py-24">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle at 72% 10%, rgba(198,166,91,0.10), transparent 26%), radial-gradient(circle at 10% 50%, rgba(246,241,230,0.035), transparent 32%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <Globe2 className="h-5 w-5 text-[#C6A65B]" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A65B]/70">
                    Global Document Intelligence
                  </p>
                </div>
                <h1 className="mt-5 max-w-5xl font-serif text-5xl font-medium leading-[0.98] tracking-[-0.03em] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
                  Understand the corridor <em className="text-[#C6A65B]">before execution.</em>
                </h1>
                <p className="mt-7 max-w-3xl text-lg leading-8 text-white/52">
                  Start with destination intelligence, then move into the geographic Atlas only when it adds value. One governed route layer supports country exploration, professional pre-flight, and secure Matter intake.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/professional#professional-journey"
                    className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#C6A65B] px-7 text-sm font-semibold text-[#060606] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#D3B56A]"
                  >
                    Review a Professional Route
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/intake?source=global-intelligence-hero"
                    className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/[0.11] px-7 text-sm font-medium text-white/68 transition-colors hover:border-[#C6A65B]/40 hover:text-[#C6A65B]"
                  >
                    Start a Matter
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  [Search, "Directory", "Find the destination and review the current operational posture."],
                  [Map, "Atlas", "Explore the geographic corridor without loading the map until you need it."],
                  [ShieldCheck, "Pre-Flight", "Carry safe route context into operator-reviewed secure intake."],
                ].map(([Icon, title, body]) => {
                  const IconComponent = Icon as typeof Search;
                  return (
                    <div key={title as string} className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A]/92 p-5">
                      <IconComponent className="h-5 w-5 text-[#C6A65B]" />
                      <h2 className="mt-4 font-serif text-xl text-[#F6F1E6]">{title as string}</h2>
                      <p className="mt-2 text-sm leading-6 text-white/36">{body as string}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <GlobalIntelligenceWorkspace
          initialView={initialView}
          initialCountry={params.country}
        />

        <section className="border-t border-white/[0.055] px-4 py-14 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/30">Indexed authority preserved</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/38">
                Existing country and Atlas routes remain live for search authority and deep links. This hub is the primary navigation layer, not a replacement for indexed jurisdiction pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/countries" className="inline-flex min-h-11 items-center rounded-xl border border-white/[0.09] px-4 text-sm text-white/55 hover:border-[#C6A65B]/30 hover:text-[#C6A65B]">
                Country Directory
              </Link>
              <Link href="/map" className="inline-flex min-h-11 items-center rounded-xl border border-white/[0.09] px-4 text-sm text-white/55 hover:border-[#C6A65B]/30 hover:text-[#C6A65B]">
                Full Atlas
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
