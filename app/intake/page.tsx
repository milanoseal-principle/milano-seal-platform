import { Suspense } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { IntakeWizard } from "@/components/intake/intake-wizard";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Begin Secure Intake | The Milano Seal™",
  description:
    "Start your document execution process. Secure intake for Remote Online Notarization, Apostille Coordination, and International Document Execution.",
};

function IntakeContent({
  searchParams,
}: {
  searchParams: Promise<{
    tier?: string;
    country?: string;
    document?: string;
    useCase?: string;
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
    country?: string;
    document?: string;
    useCase?: string;
  }>;
}) {
  const params = await searchParams;
  const prefill = {
    country: params.country || "",
    document: params.document || "",
    useCase: params.useCase || "",
  };
  const tier = params.tier as
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
    country?: string;
    document?: string;
    useCase?: string;
  }>;
}) {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
              <Shield className="w-4 h-4 text-[#C6A55A]" />
              <span className="text-sm text-[#C6A55A] font-medium">
                Secure Intake
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 text-balance">
              Begin Your Execution
            </h1>
            <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto">
              Complete the intake process below. Your matter will be structured
              for execution with precision and discretion.
            </p>
          </div>

          {/* Intake wizard */}
          <IntakeContent searchParams={searchParams} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
