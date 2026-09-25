import type { Metadata } from "next";
import { ProfessionalProfileForm } from "@/components/professional/ProfessionalProfileForm";
import { PublicShell } from "@/components/layout/PublicShell";

export const metadata: Metadata = {
  title: "Professional Profile & Defaults | The Milano Seal™",
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
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A65B]/70">Professional account</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl">Profile & defaults.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/45">Update firm details and the defaults reused on new Matters. Email and account status are managed by The Milano Seal.</p>
          <div className="mt-10">
            <ProfessionalProfileForm mode="edit" />
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
