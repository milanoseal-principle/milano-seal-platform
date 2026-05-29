import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Scale, CheckCircle, ArrowRight, Globe, Shield, FileCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Notary & Apostille Services for Attorneys | The Milano Seal™",
  description:
    "Reliable notarization and apostille coordination for law firms and legal counsel. Affidavit execution, cross-border authentication, chain-of-custody documentation, and Hague routing support.",
  alternates: { canonical: "https://themilanoseal.com/partners/attorneys" },
};

const services = [
  "Affidavit execution and notarization for client matters",
  "Apostille coordination through the Florida Department of State",
  "Cross-border document authentication for international matters",
  "Power of attorney notarization and certification",
  "Certified copy preparation for court or agency submission",
  "Hague Convention routing validation by destination country",
  "Chain-of-custody documentation and audit trail",
  "RON sessions for remote client execution",
];

const faqs = [
  {
    q: "Can you handle time-sensitive apostille matters for active litigation?",
    a: "Yes. Expedited processing and Tallahassee courier dispatch are available for urgent matters. Submit the timeline in the intake form and we will confirm turnaround availability.",
  },
  {
    q: "Do you provide a formal chain-of-custody record for evidentiary purposes?",
    a: "Every matter generates an audit trail through the client portal, including execution timestamps, identity verification records, and transit events. Records available upon request.",
  },
  {
    q: "Can you notarize documents for clients in other states or countries via RON?",
    a: "Florida RON is available for qualifying documents. Acceptance depends on the receiving authority's jurisdiction requirements. We confirm acceptance standards at intake.",
  },
];

export default function AttorneysPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Scale className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">For Attorneys &amp; Legal Counsel</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Legal Support, Affidavits &amp; Cross-Border Execution
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Reliable notarization and apostille coordination for law firms. We handle the procedural execution requirements so you can focus on legal strategy.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Schedule Matter Review</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            What We Handle for Legal Professionals
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div key={s} className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#C6A55A] flex-shrink-0 mt-0.5" />
                <span className="text-[#B0B0B0] text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Florida Commission #668288", body: "Licensed and commissioned Florida notary with RON credentials." },
            { icon: Globe, title: "Hague Convention Routing", body: "Destination validated against Hague Convention member status and consular requirements." },
            { icon: FileCheck, title: "Audit Trail Included", body: "Full chain-of-custody documentation for every matter, available through the client portal." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <Icon className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">{title}</h3>
              <p className="text-sm text-[#B0B0B0]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-medium text-white mb-8 text-center">
            Attorney Partner FAQ
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-6 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <h3 className="font-medium text-white mb-2 text-sm">{faq.q}</h3>
                <p className="text-[#B0B0B0] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready to Coordinate a Matter?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your matter details. We will confirm execution requirements, timeline, and pricing before anything is scheduled.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Schedule Matter Review</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
            I am not an attorney. Legal services are provided by Demesmin &amp; Dover PLLC. Final document acceptance and cross-border validation reliability rest explicitly with the receiving foreign authority.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
