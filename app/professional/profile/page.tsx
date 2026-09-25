import type { Metadata } from "next";
import { ProfessionalProfileForm } from "@/components/professional/ProfessionalProfileForm";
import { PublicShell } from "@/components/layout/PublicShell";

export const metadata: Metadata = {
  title: "Create Professional Profile | The Milano Seal™",
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
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A65B]/70">Professional profile</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl">Create your professional profile.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/45">Firm-level details and reusable defaults for referred Matters. The Milano Seal reviews each profile and sends account access to the email provided. Client details are never stored on your profile.</p>
          <div className="mt-10">
            <ProfessionalProfileForm mode="create" />
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
