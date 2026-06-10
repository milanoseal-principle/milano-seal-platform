import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, Lock, Globe, Shield, Eye, FileCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — Execution Process | The Milano Seal™",
  description:
    "The Milano Seal™ six-stage execution process: matter intake, compliance review, payment-gated scheduling, document execution, chain-of-custody tracking, and structured international release.",
  alternates: { canonical: "https://themilanoseal.com/process" },
};

const stages = [
  {
    id: "compliance-review",
    number: "02",
    icon: Shield,
    title: "Compliance Review",
    headline: "Jurisdiction Validation & Execution Path Determination",
    body: "Every matter begins with a jurisdictional review. Destination-country requirements, document type parameters, and authentication pathway options are assessed before any execution is scheduled. This ensures that your documents are structured correctly for the receiving authority.",
    details: [
      "Destination-country apostille or consular legalization path confirmed",
      "Document format and language requirements validated",
      "Identity verification requirements outlined",
      "Estimated processing timeline provided",
    ],
  },
  {
    id: "payment-gate",
    number: "03",
    icon: Lock,
    title: "Payment-Gated Execution",
    headline: "No Scheduling Until Scope is Confirmed & Payment is Complete",
    body: "The Milano Seal™ does not schedule or execute any matter until scope has been confirmed in writing and payment has been received in full. This is a deliberate structural control — it protects the integrity of the execution chain and ensures complete alignment before any document is touched.",
    details: [
      "Scope confirmation provided in writing before payment",
      "Payment processed through secure Wise international infrastructure",
      "Scheduling unlocked immediately upon payment confirmation",
      "Scope changes after payment initiation require re-confirmation",
    ],
    highlight: true,
  },
  {
    id: "execution",
    number: "04",
    icon: FileCheck,
    title: "Document Execution",
    headline: "RON, Mobile Notary, and Execution Pathways",
    body: "Documents are executed under Florida law via Remote Online Notarization (RON) or in-person mobile notary depending on document type, jurisdiction requirements, and client preference. Every execution session is recorded, sealed, and logged.",
    details: [
      "RON: encrypted video session, identity-verified, cryptographic seal applied",
      "Mobile notary: in-person dispatch to client location",
      "Witness coordination arranged where required by document type",
      "Execution recorded and retained per Florida statutory requirements",
    ],
  },
  {
    id: "custody",
    number: "05",
    icon: Eye,
    title: "Chain-of-Custody Visibility",
    headline: "Real-Time Status Through the Client Portal",
    body: "From execution through final delivery, matter status is maintained in the client portal. Every transit event, authentication step, and courier handoff is logged and visible. This is one of The Milano Seal™'s strongest trust differentiators.",
    details: [
      "Matter status updated at each authentication and transit stage",
      "Courier tracking integrated for physical document transit",
      "Audit trail available for all matter events",
      "Client portal access provided at matter initiation",
    ],
  },
  {
    id: "release",
    number: "06",
    icon: Globe,
    title: "Structured International Release",
    headline: "Apostille, Courier, and Destination Delivery",
    body: "The final stage coordinates apostille issuance, international courier dispatch, and structured release to the destination authority. Delivery is confirmed and documented. Physical originals shipped via tracked international courier where required.",
    details: [
      "Apostille issued by the Florida Department of State",
      "International courier dispatch via DHL or FedEx International",
      "Delivery confirmation provided to client portal",
      "Consular legalization coordinated for non-Hague jurisdictions",
    ],
  },
];

export default function ProcessPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#C6A55A] text-sm font-medium tracking-wider uppercase mb-4 block">
            Execution Path
          </span>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            How It Works
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Six structured stages from matter intake through international delivery. Every step designed for compliance, precision, and complete client visibility.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Submit Your Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Stage 01 callout */}
      <section className="pb-0 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-5 p-6 bg-[#111111] border border-[#C6A55A]/20 rounded-xl">
            <span className="font-serif text-3xl font-medium text-[#C6A55A]/40 flex-shrink-0 leading-none mt-1">01</span>
            <div>
              <h3 className="font-medium text-white mb-1">Submit Your Matter</h3>
              <p className="text-[#B0B0B0] text-sm leading-relaxed mb-3">
                Every engagement begins at the smart matter intake gate. Provide document details, destination requirements, and your timeline.
              </p>
              <Link href="/intake" className="inline-flex items-center gap-2 text-sm text-[#C6A55A] hover:underline">
                Go to Intake <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stages 02–06 */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {stages.map((stage) => (
            <div
              key={stage.id}
              id={stage.id}
              className={`p-8 border rounded-xl scroll-mt-24${stage.highlight ? " border-[#C6A55A]/25 bg-[#0D0B08]" : " border-[#2A2A2A] bg-[#111111]"}`}
            >
              <div className="flex items-start gap-5">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <span className="font-serif text-3xl font-medium text-[#C6A55A]/30 leading-none">
                    {stage.number}
                  </span>
                  <div className={`p-2 rounded-lg ${stage.highlight ? "bg-[#C6A55A]/10 border border-[#C6A55A]/30" : "bg-[#1A1A1A] border border-[#2A2A2A]"}`}>
                    <stage.icon className="w-4 h-4 text-[#C6A55A]" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-xl md:text-2xl font-medium text-white mb-1">
                    {stage.title}
                  </h2>
                  <p className="text-[#C6A55A]/80 text-sm font-medium mb-4">{stage.headline}</p>
                  <p className="text-[#B0B0B0] text-sm leading-relaxed mb-5">{stage.body}</p>
                  <ul className="space-y-2">
                    {stage.details.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm text-[#8A8A8A]">
                        <span className="text-[#C6A55A]/40 mt-0.5">—</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready to Begin?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your matter and we will confirm scope, timeline, and pricing before anything is scheduled.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Submit Your Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. The Milano Seal does not provide legal advice. Legal questions should be handled by a licensed attorney.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
