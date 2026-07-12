import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { HVA_REQUIRED_DISCLAIMER } from "@/lib/high-value-assets/safetyGuard";

export const metadata: Metadata = {
  title: "High-Value Asset Document Execution Support | The Milano Seal™",
  description:
    "Notarized execution, apostille coordination, entity-authority documents, and deadline-sensitive document workflows for vessels, aircraft, exotic vehicles, art, collectibles, and other high-value assets. Document execution support only.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://themilanoseal.com/services/high-value-asset-document-execution" },
};

const ASSETS = [
  "Vessels & yachts", "Aircraft", "Exotic & classic vehicles",
  "Art & collectibles", "Jewelry & watches", "Heavy & commercial equipment",
  "Cross-border / international assets",
];

export default function HighValueAssetServicePage() {
  return (
    <>
      <Header />
      <main className="bg-[#060606] min-h-screen overflow-x-hidden" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-10 md:py-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70 mb-3">High-Value Asset Document Execution</p>
          <h1 className="font-serif text-3xl md:text-5xl text-white leading-tight mb-4">
            High-Value Asset <em className="text-[var(--ms-gold)]">Document Execution</em> Support
          </h1>
          <p className="text-white/55 text-sm md:text-base leading-relaxed max-w-2xl mb-8">
            Support for notarized execution, apostille coordination, entity-authority documents, and deadline-sensitive
            document workflows involving vessels, aircraft, exotic vehicles, art, collectibles, and other high-value assets.
          </p>

          <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ASSETS.map((a) => (
              <div key={a} className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2 text-[12px] text-white/60">{a}</div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-300/20 bg-black/40 p-4 mb-8">
            <p className="text-[13px] leading-relaxed text-white/60">
              <strong className="text-white/80">Important:</strong> Milano Seal does not provide legal, title, customs, tax,
              insurance, valuation, registry, or regulatory approval services. Workflows may require review by attorneys,
              title/escrow professionals, customs brokers, registry specialists, or other qualified professionals.
            </p>
          </div>

          <Link href="/intake?category=high-value-asset" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#050507] transition-colors hover:bg-[var(--ms-gold)]/90">
            Request Document Execution Support
          </Link>

          <p className="mt-10 border-t border-white/[0.06] pt-4 font-mono text-[9px] leading-relaxed text-white/30">{HVA_REQUIRED_DISCLAIMER}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
