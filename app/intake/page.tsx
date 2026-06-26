import { Suspense } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { IntakeWizard } from "@/components/intake/intake-wizard";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Begin Execution | The Milano Seal™",
  description:
    "Start your document execution process. Secure intake for Remote Online Notarization, Apostille Coordination, and International Document Execution.",
};

function IntakeContent({
  searchParams,
}: {
  searchParams: Promise<{
    tier?: string;
    lane?: string;
    destination?: string;
    country?: string;
    document?: string;
    useCase?: string;
    matter?: string;
  }>;
}) {
  return (
    <Suspense fallback={<div className="h-[600px]" />}>
      <IntakeWizardWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function IntakeWizardWrapper({
  searchParams,
}: {
  searchParams: Promise<{
    tier?: string;
    lane?: string;
    destination?: string;
    country?: string;
    document?: string;
    useCase?: string;
    matter?: string;
  }>;
}) {
  const params = await searchParams;
  const prefill = {
    country: params.country || params.destination || "",
    document: params.document || "",
    useCase: params.useCase || params.matter || "",
  };
  const tier = (params.tier || params.lane) as
    | "signature"
    | "priority"
    | "executive"
    | undefined;
  const validTier =
    tier && ["signature", "priority", "executive"].includes(tier)
      ? tier
      : "priority";

  return <IntakeWizard initialTier={validTier} prefill={prefill} />;
}

export default function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{
    tier?: string;
    lane?: string;
    destination?: string;
    country?: string;
    document?: string;
    useCase?: string;
    matter?: string;
  }>;
}) {
  return (
    <main className="ms-os-page min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="relative overflow-hidden px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 1.5rem)" }}>
        <div className="ms-os-atmosphere" aria-hidden="true" />
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="relative z-10 mb-10 text-center sm:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--ms-gold)]/10 border border-[var(--ms-gold)]/30 rounded-full mb-6">
              <Shield className="w-4 h-4 text-[var(--ms-gold)]" />
              <span className="text-sm text-[var(--ms-gold)] font-medium">
              Secure Records Intake
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 text-balance">
              Begin Your Execution
            </h1>
            <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto">
              Complete the controlled intake below. Destination context from
              Global Document Intelligence is preserved when you arrive from a
              routing corridor.
            </p>
          </div>

          {/* Intake wizard */}
          <div className="relative z-10">
            <IntakeContent searchParams={searchParams} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
