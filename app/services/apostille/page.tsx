import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { FileCheck, Globe, CheckCircle, ArrowRight, Navigation } from "lucide-react";

export const metadata: Metadata = {
  title: "Apostille Coordination | The Milano Seal™",
  description:
    "Apostille and authentication coordination for U.S. documents intended for international use, with document-origin review, competent-authority routing, custody visibility, and receiving-authority awareness.",
  alternates: { canonical: "https://themilanoseal.com/services/apostille" },
};

const steps = [
  { title: "Document Assessment", body: "Incoming documents are reviewed for completeness, origin, execution posture, and route readiness before authority submission." },
  { title: "Competent Authority Routing", body: "The applicable state or federal competent authority is determined from the document origin and Matter facts before submission. Processing timelines depend on the controlling authority and current queue." },
  { title: "Destination Route Review", body: "Destination routing is reviewed against governed treaty status and receiving-authority information. Apostille, authentication, consular legalization, translation review, or additional handling may apply." },
  { title: "Tracking & Status", body: "Real-time status visibility maintained through the client portal from submission through return. Transit and courier tracking included." },
  { title: "Delivery Coordination", body: "Apostilled documents delivered digitally and/or physically per destination authority requirements. Expedited courier available for urgent matters." },
];

const haagueMemberExamples = [
  "Italy", "Spain", "Germany", "France", "Portugal", "Greece",
  "Mexico", "Brazil", "Australia", "United Kingdom",
];

export default function ApostillePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <FileCheck className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">Apostille Coordination</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Department of State Workflow &amp; Timelines
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Governed apostille and authentication coordination from document review through controlled release. The applicable authority route is determined from document origin, destination, and Matter-specific requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/intake"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
            >
              <span>Start Apostille Matter</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/countries"
              className="inline-flex items-center gap-3 px-8 py-4 bg-transparent text-[#C6A55A] border border-[#C6A55A]/30 font-medium rounded-lg transition-all duration-300 hover:border-[#C6A55A]/60"
            >
              <Globe className="w-5 h-5" />
              <span>View Countries</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-10 text-center">
            Authentication Sequence
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-5 p-6 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <span className="font-serif text-3xl font-medium text-[#C6A55A]/20 flex-shrink-0 leading-none mt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-medium text-white mb-1">{step.title}</h3>
                  <p className="text-[#B0B0B0] text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hague Members */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4 text-center">
            Common Destination Countries
          </h2>
          <p className="text-[#B0B0B0] text-center mb-8 text-sm">
            These are common destination corridors. The controlling route is determined from current treaty status, document origin, and the receiving authority—not from destination alone.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {haagueMemberExamples.map((country) => (
              <Link
                key={country}
                href={`/countries/${country.toLowerCase().replace(/ /g, "-")}`}
                className="flex items-center gap-2 p-3 bg-[#111111] border border-[#2A2A2A] rounded-lg hover:border-[#C6A55A]/30 transition-colors group"
              >
                <Globe className="w-3.5 h-3.5 text-[#C6A55A] flex-shrink-0" />
                <span className="text-sm text-[#B0B0B0] group-hover:text-white transition-colors">{country}</span>
              </Link>
            ))}
          </div>
          <p className="text-center mt-6 text-sm text-[#B0B0B0]/60">
            <Link href="/countries" className="text-[#C6A55A] hover:underline">View full country directory →</Link>
          </p>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: FileCheck, title: "Authority Routing", body: "State or federal competent-authority routing is reviewed before submission; Florida Department of State applies only when the document origin and route call for it." },
            { icon: Globe, title: "Governed Route Review", body: "Destination routing is reviewed against current governed treaty status and receiving-authority requirements." },
            { icon: Navigation, title: "Tracking Provided", body: "Matter status and transit monitoring through the client portal from start to delivery." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <Icon className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">{title}</h3>
              <p className="text-sm text-[#B0B0B0]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Translation & Authentication Review Notes */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <h3 className="font-medium text-white mb-3">Translation Review</h3>
            <p className="text-sm text-[#B0B0B0] leading-relaxed">
              Some destination countries or receiving authorities may require translated documents, sworn translations, certified translations, or format-specific language handling. The Milano Seal flags translation-sensitive matters for coordinator review before release.
            </p>
          </div>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <h3 className="font-medium text-white mb-3">Authentication Review</h3>
            <p className="text-sm text-[#B0B0B0] leading-relaxed">
              Some countries are not handled through a standard apostille pathway and may require authentication or consular legalization review. The Milano Seal routes these matters for additional coordinator review before execution or release.
            </p>
          </div>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <h3 className="font-medium text-white mb-3">What Clients Need to Know</h3>
            <p className="text-sm text-[#B0B0B0] leading-relaxed">
              Most clients are not expected to know the correct apostille, authentication, or translation pathway before intake. The Milano Seal structures the matter based on document type, signer location, destination country, and receiving authority information. If something is unclear, we flag it for coordinator review before execution.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Begin Your Apostille Process
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your document details, origin, destination, and known receiving authority. We will review the execution route, timing assumptions, and pricing before scheduling.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start Apostille Intake</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. Document execution coordination only. The Milano Seal™ does not provide legal guidance. Legal questions should be handled by a licensed attorney.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
