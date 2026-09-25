import type { Metadata } from "next";
import { ProfessionalMatterForm } from "@/components/professional/ProfessionalMatterForm";
import { PublicShell } from "@/components/layout/PublicShell";

export const metadata: Metadata = {
  title: "Start a Client Matter | The Milano Seal™",
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
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A65B]/70">Start a client Matter</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl">Start a client Matter.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/45">Submit the Matter for your client, or send your client a secure intake link. Report what is known; the execution route and notarial act are confirmed in operator review.</p>
          <div className="mt-10">
            <ProfessionalMatterForm />
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
