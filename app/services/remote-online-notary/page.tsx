import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, Monitor, Shield, Video, FileCheck, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Remote Online Notarization (RON) | The Milano Seal™",
  description:
    "Secure, identity-verified Remote Online Notarization compliant with Florida law. Valid for domestic and international use when accepted by the receiving authority.",
  keywords: [
    "remote online notarization",
    "RON Florida",
    "online notary",
    "digital notarization",
    "notarize documents online",
    "Florida RON",
  ],
  alternates: { canonical: "https://themilanoseal.com/services/remote-online-notary" },
};

const FEATURES = [
  { icon: Shield, label: "Multi-Factor Identity Verification", detail: "Identity confirmed through approved RON platform procedures before session begins." },
  { icon: Video,  label: "Encrypted Audio-Video Session",      detail: "Tamper-secure session recording retained per Florida statutory storage parameters." },
  { icon: FileCheck, label: "Tamper-Evident Cryptographic Seal", detail: "Digital signature identifies any post-execution document alteration." },
  { icon: Monitor,   label: "Immediate Document Delivery",       detail: "Executed document available digitally upon session completion." },
];

const PROCESS = [
  "Submit your matter through our secure intake process.",
  "Provide valid government-issued photo ID for identity verification.",
  "Connect via secure video session at your scheduled time.",
  "Documents are reviewed, executed, and sealed in real time.",
  "Notarized document delivered digitally for your records and use.",
];

export default function RemoteOnlineNotarizationPage() {
  return (
    <>
      <Header />
      <main className="bg-[#050507] min-h-screen">
        {/* Hero */}
        <section className="pt-28 pb-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-medium mb-4">
              Service — Remote Execution
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 text-balance">
              Remote Online Notarization
            </h1>
            <p className="text-[#B0B0B0] text-lg max-w-2xl leading-relaxed mb-8">
              Secure, identity-verified digital notarization compliant with Florida law.
              Valid for domestic and international use when accepted by the receiving authority.
              No in-person appearance required.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
            >
              Begin RON Matter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-medium text-white mb-8">Session Components</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {FEATURES.map((f) => (
                <div key={f.label} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-6">
                  <div className="inline-flex p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                    <f.icon className="w-5 h-5 text-[#C6A55A]" />
                  </div>
                  <h3 className="text-white font-medium text-sm mb-2">{f.label}</h3>
                  <p className="text-[#8A8A8A] text-xs leading-relaxed">{f.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-medium text-white mb-8">Execution Sequence</h2>
            <ol className="space-y-4">
              {PROCESS.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="font-serif text-2xl font-medium text-[#C6A55A]/30 flex-shrink-0 w-8">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[#B0B0B0] text-sm leading-relaxed pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl font-medium text-white mb-4">Ready to Execute Remotely?</h2>
            <p className="text-[#8A8A8A] text-sm mb-8 max-w-md mx-auto">
              Submit your matter through secure intake. No in-person appearance required.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
            >
              Start Your Matter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
