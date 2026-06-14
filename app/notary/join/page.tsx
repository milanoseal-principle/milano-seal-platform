import type { Metadata } from "next";
import { NotaryJoinForm } from "@/components/notary/NotaryJoinForm";

export const metadata: Metadata = {
  title: "Join the Alliance Notary Network | The Milano Seal™",
  description:
    "Apply to become a certified notary partner or RON provider in The Milano Seal™ Alliance Network. Florida and multi-state notaries welcome.",
};

export default function NotaryJoinPage() {
  return (
    <main className="min-h-screen bg-[#050507] text-white">
      {/* Header band */}
      <div className="border-b border-[#C6A55A]/10">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/milano-seal-orb-v2.png"
            alt="The Milano Seal"
            width={32}
            height={32}
            style={{ objectFit: "contain" }}
          />
          <span className="font-serif text-[#D3B35A] tracking-[0.2em] uppercase text-sm font-semibold">
            The Milano Seal™
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <p className="font-mono text-[#C6A55A] text-xs tracking-[0.25em] uppercase mb-3">
            Alliance Notary Network
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-4 leading-snug">
            Join Our Network of<br />
            <span className="text-[#C6A55A] italic">Certified Execution Partners</span>
          </h1>
          <p className="text-[#8A8A8A] text-base leading-relaxed max-w-xl">
            The Milano Seal™ works with a vetted network of Florida-commissioned notaries,
            RON-certified providers, and mobile notaries to support international document
            execution. Apply to join.
          </p>
        </div>

        {/* What We Look For */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              title: "RON Notaries",
              desc: "Florida or multi-state remote online notarization authorization. BlueNotary or approved platform experience preferred.",
            },
            {
              title: "Mobile Notaries",
              desc: "Florida-commissioned notaries available for in-person and signing agent assignments in Tampa Bay and surrounding areas.",
            },
            {
              title: "Hybrid Partners",
              desc: "Notaries offering both RON and mobile capabilities. Priority consideration for high-volume international matters.",
            },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-[#0A0A0A] border border-[#C6A55A]/10 rounded-xl p-5">
              <p className="text-[#C6A55A] font-semibold text-sm mb-2">{title}</p>
              <p className="text-[#6A6A6A] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5 mb-8">
          <p className="text-[#8A8A8A] text-xs font-semibold uppercase tracking-widest mb-3">Minimum Requirements</p>
          <ul className="space-y-2">
            {[
              "Active notary commission in Florida or another U.S. state",
              "E&O insurance (minimum $25,000 recommended)",
              "Background check consent",
              "Professional references or verifiable notarization history",
              "For RON: approved platform authorization and identity verification experience",
            ].map((req) => (
              <li key={req} className="flex items-start gap-2 text-xs text-[#8A8A8A]">
                <span className="text-[#C6A55A] mt-0.5 flex-shrink-0">—</span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <NotaryJoinForm />

        {/* Disclaimer */}
        <p className="text-[#3A3A3A] text-xs mt-8 leading-relaxed">
          Submission of this application does not guarantee acceptance into the Alliance Notary Network.
          All applications are reviewed by The Milano Seal™ founder. Approved partners will be contacted
          by email with next steps. The Milano Seal™ reserves the right to accept or decline any application
          at its sole discretion.
        </p>
      </div>
    </main>
  );
}
