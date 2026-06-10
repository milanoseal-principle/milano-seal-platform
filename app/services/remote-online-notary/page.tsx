import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Monitor, Shield, Video, CheckCircle, ArrowRight, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Remote Online Notarization (RON) | The Milano Seal™",
  description:
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
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. The Milano Seal does not provide legal advice. Legal questions should be handled by a licensed attorney.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
