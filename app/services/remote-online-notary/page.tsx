import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, Monitor, Shield, Video, FileCheck, CheckCircle } from "lucide-react";
import { Monitor, Shield, Video, CheckCircle, ArrowRight, Lock } from "lucide-react";

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
    "Secure, identity-verified remote online notarization compliant with Florida law. Audio-video recording, cryptographic sealing, and immediate digital delivery for domestic and international use.",
  alternates: { canonical: "https://themilanoseal.com/services/remote-online-notary" },
};

const steps = [
  { title: "Identity Verification", body: "Multi-factor identity verification performed through an approved RON platform. Credential analysis and knowledge-based authentication completed prior to session initiation." },
  { title: "Audio-Video Session", body: "Fully encrypted, tamper-secure session recording. The session is retained per Florida statutory storage requirements and is available for audit upon request." },
  { title: "Document Execution", body: "Documents are reviewed, signed, and notarized in real time. The notary applies a tamper-evident electronic seal credentialing the execution event." },
  { title: "Cryptographic Seal", body: "Advanced digital signature validation identifies any post-execution alterations. The sealed document is compliant with Florida Statutes Chapter 117." },
  { title: "Immediate Delivery", body: "Executed documents are delivered digitally to the client portal. Physical copies coordinated upon request for authorities requiring wet-ink originals." },
];

const techRequirements = [
  "Device with camera and microphone (laptop, tablet, or phone)",
  "Stable internet connection (minimum 3 Mbps)",
  "Government-issued photo ID (passport, driver's license)",
  "Access to the secure RON platform link provided at scheduling",
];

export default function RemoteOnlineNotaryPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Monitor className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">Remote Online Notarization</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            RON Process & Identity Verification
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Secure digital notarization executed entirely online. Florida-compliant identity verification, encrypted session recording, and cryptographic sealing — no travel required.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin RON Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-10 text-center">
            Verification & Execution Flow
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

      {/* Tech Requirements */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Technology Requirements
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {techRequirements.map((req) => (
              <div key={req} className="flex items-start gap-3 p-4 bg-[#111111] border border-[#2A2A2A] rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#C6A55A] flex-shrink-0 mt-0.5" />
                <span className="text-[#B0B0B0] text-sm">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Florida Certified", body: "RON-commissioned notary under Florida Statutes." },
            { icon: Video, title: "Session Recording", body: "Encrypted recording retained per statutory requirements." },
            { icon: Lock, title: "Tamper-Evident", body: "Cryptographic seal detects post-execution modifications." },
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

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready to Proceed Remotely?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your matter details and we will confirm scheduling, platform access, and document requirements.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start RON Intake</span>
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
