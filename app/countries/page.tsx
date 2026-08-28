import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";
import { Globe, ArrowRight } from "lucide-react";
import { MilanoPublicCtaModule } from "@/components/conversion/MilanoPublicCtaModule";
import { CountriesDirectoryInteractive } from "@/components/countries/CountriesDirectoryInteractive";
import { ProgressiveCertaintyExplorer } from "@/components/progressive-certainty/ProgressiveCertaintyExplorer";

export const metadata: Metadata = {
  title: "Global Document Intelligence — Country & Apostille Routes | The Milano Seal™",
  description:
    "Global document intelligence for apostille, authentication, consular review, and U.S. document execution routes by destination country.",
  alternates: { canonical: "https://themilanoseal.com/countries" },
};

export default function CountriesPage() {
  return (
    <PublicShell>
      <main className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
        <section
          className="pb-8 px-4 sm:px-6"
          style={{
            paddingTop:
              "calc(var(--header-total-height) + var(--sa-top) + 1.5rem)",
          }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-4">
              <Globe className="w-4 h-4 text-[#C6A55A]" />
              <span className="text-sm text-[#C6A55A] font-medium">
                Global Document Intelligence
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 text-balance">
              Understand the corridor before execution begins.
            </h1>
            <p className="text-base md:text-lg text-[#B0B0B0] mb-5 max-w-2xl mx-auto leading-relaxed">
              Structure the destination, document class, U.S. origin, and signer posture first. Then review the current apostille, authentication, consular, receiving-authority, document, and compliance posture.
            </p>
          </div>
        </section>

        <ProgressiveCertaintyExplorer />
        <CountriesDirectoryInteractive />

        <section className="px-4 pb-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/global-document-intelligence?view=map"
              className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 border border-[#C6A55A]/30 text-[#C6A55A] text-sm font-medium rounded-lg hover:border-[#C6A55A] transition-colors"
            >
              <Globe className="w-4 h-4" />
              Open Global Intelligence Atlas
            </Link>
            <p className="text-sm text-[#6A6A6A]">
              Don&apos;t see your country?{" "}
              <Link href="/intake" className="text-[#C6A55A] hover:underline">
                Start secure intake
              </Link>{" "}
              for operator review.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6 bg-[#111111]">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
              Ready to Structure the Matter?
            </h2>
            <p className="text-[#B0B0B0] mb-8">
              Submit the document, destination, origin, signer, and receiving-authority context. Milano will review the operational execution path before scheduling.
            </p>
            <Link
              href="/intake"
              className="group inline-flex min-h-12 items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
            >
              <span>Structure a Matter</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        <MilanoPublicCtaModule className="pb-12" />
      </main>
    </PublicShell>
  );
}
