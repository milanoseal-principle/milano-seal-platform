import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";
import { ExecutionIntelligenceWorkspace } from "@/components/global-intelligence/ExecutionIntelligenceWorkspace";

const canonical = "https://www.themilanoseal.com/global-document-intelligence";

export const metadata: Metadata = {
  title: "Execution Intelligence Workspace | The Milano Seal™",
  description:
    "Select a document and destination corridor to review governed execution intelligence, custody routing, receiving-authority posture, and secure intake pathways.",
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Execution Intelligence Workspace | The Milano Seal™",
    description:
      "One synchronized workspace for document selection, country intelligence, execution corridor mapping, custody flow, and secure intake.",
    url: canonical,
    siteName: "The Milano Seal™",
    type: "website",
  },
};

export default async function GlobalDocumentIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;

  return (
    <PublicShell>
      <main
        className="min-h-screen overflow-x-hidden bg-[#050706] text-white"
        style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}
      >
        <ExecutionIntelligenceWorkspace initialCountry={params.country} />

        <section className="border-t border-[#A77D2E]/25 bg-[#050706] px-4 py-12 sm:px-6">
          <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C6A65B]/60">
                Indexed authority preserved
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/36">
                Existing country and Atlas routes remain live for search authority and deep links. The workspace synchronizes those governed sources rather than replacing them.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/countries"
                className="inline-flex min-h-11 items-center rounded-xl border border-white/[0.09] px-4 text-sm text-white/55 transition-colors hover:border-[#C6A65B]/35 hover:text-[#C6A65B]"
              >
                Country Directory
              </Link>
              <Link
                href="/map"
                className="inline-flex min-h-11 items-center rounded-xl border border-[#C6A65B]/30 px-4 text-sm text-[#C6A65B] transition-colors hover:border-[#C6A65B]/60"
              >
                Full Atlas
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
