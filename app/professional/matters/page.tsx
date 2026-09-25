import type { Metadata } from "next";
import { ProfessionalMatterDashboard } from "@/components/professional/ProfessionalMatterDashboard";
import { PublicShell } from "@/components/layout/PublicShell";

export const metadata: Metadata = {
  title: "Referred Matters | The Milano Seal™",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PublicShell>
      <main
        className="min-h-screen bg-[#060606] px-4 pb-20 text-white sm:px-6"
        style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 3rem)" }}
      >
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A65B]/70">Professional workspace</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl">Your referred Matters.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/45">Status for Matters you referred, from intake through completion. You retain legal control; The Milano Seal handles the U.S. execution side.</p>
          <div className="mt-10">
            <ProfessionalMatterDashboard />
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
