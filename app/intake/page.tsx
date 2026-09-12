import { Suspense } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { SmartIntakeSOPWizard } from "@/components/intake/smart-intake-sop-wizard";
import { Check, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Begin Secure Intake | The Milano Seal™",
  description:
    "Start your document execution process. Secure intake for Remote Online Notarization, Apostille Coordination, and International Document Execution.",
};

type IntakeSearchParams = {
  tier?: string;
  lane?: string;
  destination?: string;
  country?: string;
  document?: string;
  document_type?: string;
  origin?: string;
  signer_posture?: string;
  receiving_authority?: string;
  useCase?: string;
  matter?: string;
  courtesy?: string;
  source?: string;
  referral_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

function normalizeCourtesyCode(value?: string): string | undefined {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return undefined;
  return /^[A-Z0-9][A-Z0-9_-]{2,63}$/.test(normalized) ? normalized : undefined;
}

function humanize(value?: string) {
  return value?.trim().replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "";
}

function buildProfessionalMatter(params: IntakeSearchParams) {
  if (params.lane !== "professional") return params.matter || params.useCase || "";

  const destination = params.country || humanize(params.destination);
  const document = humanize(params.document || params.document_type);
  const origin = humanize(params.origin);
  const signer = humanize(params.signer_posture);
  const authority = params.receiving_authority?.trim();
  const facts = [
    document ? `Document: ${document}.` : "",
    destination ? `Destination: ${destination}.` : "",
    origin ? `U.S. origin: ${origin}.` : "",
    signer ? `Signer posture: ${signer}.` : "",
    authority ? `Receiving authority: ${authority}.` : "",
  ].filter(Boolean);

  return params.matter || params.useCase || `Professional Matter pre-flight carried forward. ${facts.join(" ")}`;
}

function IntakeContent({
  searchParams,
}: {
  searchParams: Promise<IntakeSearchParams>;
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
  searchParams: Promise<IntakeSearchParams>;
}) {
  const params = await searchParams;
  const isProfessional = params.lane === "professional";
  const country = params.country || params.destination || "";
  const document = params.document || params.document_type?.replace(/_/g, "-") || "";
  const professionalMatter = buildProfessionalMatter(params);
  const prefill = {
    country,
    document,
    useCase: params.useCase || params.matter || "",
    matter: professionalMatter,
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

  // URL/query values are routing hints only. The API validates existence,
  // status, usage limit, time window, and eligibility server-side before a
  // discount can affect pricing. This permits disposable E2E codes without
  // hard-coding production courtesy programs into the browser layer.
  const courtesyCode = normalizeCourtesyCode(params.courtesy);

  return (
    <>
      {isProfessional ? (
        <div className="mx-auto mb-5 w-full max-w-2xl rounded-2xl border border-[var(--ms-gold)]/24 bg-[var(--ms-gold)]/[0.045] px-5 py-4 text-left sm:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ms-gold)]/25 bg-black/20">
              <Check className="h-4 w-4 text-[var(--ms-gold)]" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/75">Professional pre-flight carried forward</p>
              <p className="mt-1.5 text-sm leading-6 text-white/58">
                Destination, document, U.S. origin, signer posture, and known receiving-authority context from the professional journey are preserved here. Confirm or correct the Matter once; do not re-enter the route from scratch.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <SmartIntakeSOPWizard
        initialTier={validTier}
        prefill={prefill}
        courtesyCode={courtesyCode}
      />
    </>
  );
}

export default function IntakePage({
  searchParams,
}: {
  searchParams: Promise<IntakeSearchParams>;
}) {
  return (
    <main className="ms-os-page min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="relative overflow-hidden px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 1.5rem)" }}>
        <div className="ms-os-atmosphere" aria-hidden="true" />
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 mb-10 text-center sm:mb-12">
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 460, height: 220, background: "radial-gradient(circle, rgba(198,165,90,0.10), transparent 70%)", filter: "blur(8px)" }} />
            <div className="relative inline-flex items-center gap-2 px-4 py-2 bg-[var(--ms-gold)]/10 border border-[var(--ms-gold)]/30 rounded-full mb-6">
              <Shield className="w-4 h-4 text-[var(--ms-gold)]" />
              <span className="text-sm text-[var(--ms-gold)] font-medium">Secure Records Intake</span>
            </div>
            <h1 className="relative font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 text-balance">Begin Your Execution</h1>
            <p className="relative text-[#B0B0B0] text-lg max-w-2xl mx-auto">Matter-first intake with controlled document intelligence, route review, and payment-gated execution.</p>
            <div className="relative mt-6 flex flex-wrap justify-center gap-2">
              {["50% Deposit Unlocks Scheduling", "Hague Route Review", "Final 50% Before International Release"].map((c) => (
                <span key={c} className="rounded-full border border-[var(--ms-gold)]/22 bg-[var(--ms-gold)]/[0.05] px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/80">{c}</span>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <IntakeContent searchParams={searchParams} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
