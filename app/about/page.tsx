import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import { Shield, Globe, FileCheck, Award, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About The Milano Seal™ — International Document Execution",
  description:
    "U.S.-based international document execution and apostille coordination. Structured for attorneys, private clients, and institutions operating across jurisdictions.",
};

const PILLARS = [
  {
    icon: Shield,
    title: "Procedural Authority",
    desc: "Every matter is structured through a deterministic execution protocol — not improvised. Same compliance standard on every engagement.",
  },
  {
    icon: Globe,
    title: "International Reach",
    desc: "Apostille coordination, RON execution, and international document routing across Hague and non-Hague jurisdictions.",
  },
  {
    icon: FileCheck,
    title: "Execution Precision",
    desc: "Document integrity from intake to delivery. No gaps in chain of custody. No errors in the execution record.",
  },
  {
    icon: Award,
    title: "Institutional Trust",
    desc: "Built for attorneys, law firms, corporate clients, and international private parties who require more than commodity notarization.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="bg-[#0A0A0A] text-white min-h-screen">
        {/* Hero */}
        <section className="relative pb-24 px-6 overflow-hidden" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#C6A55A]/5 to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-6">
              The Milano Seal™
            </p>
            <h1 className="font-serif text-4xl md:text-6xl font-medium text-white mb-8 leading-tight">
              International Document
              <br />
              Execution & Apostille Coordination
            </h1>
            <div className="w-16 h-px bg-[#C6A55A] mx-auto mb-8 opacity-60" />
            <p className="text-[#B0B0B0] text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
              A U.S.-based execution platform structured for international
              document matters. Built for the complexity that standard
              notarization services cannot handle.
            </p>
          </div>
        </section>

        {/* What We Are */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4">
                  The System
                </p>
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6">
                  This is not a notary service.
                  <br />
                  This is an execution platform.
                </h2>
                <div className="space-y-5 text-[#B0B0B0] font-light leading-relaxed">
                  <p>
                    The Milano Seal™ was built to address a specific gap in the
                    international document market — the space between basic
                    notarization and full legal coordination where most matters
                    get lost.
                  </p>
                  <p>
                    Attorneys need more than a signature. International clients
                    need more than a stamp. Corporate transactions require
                    procedural precision that standard services cannot provide.
                  </p>
                  <p>
                    We fill that gap with structured execution, Hague-compliant
                    apostille coordination, and a deterministic workflow that
                    produces reliable results across jurisdictions.
                  </p>
                </div>
                <Link
                  href="/intake"
                  className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-sm hover:bg-[#D4BB7A] transition-colors"
                >
                  Begin Secure Intake
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative">
                <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-10 space-y-6">
                  {[
                    ["Execution Jurisdiction", "Florida — RON + Mobile"],
                    ["Apostille Coordination", "Florida Department of State"],
                    ["Hague Convention", "21+ Member Countries"],
                    ["Document Scope", "17 classified document types"],
                    [
                      "Primary Markets",
                      "Italy · Spain · Mexico · Portugal · Brazil",
                    ],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 pb-6 border-b border-[#1A1A1A] last:border-0 last:pb-0"
                    >
                      <span className="text-[#8A8A8A] text-sm">{label}</span>
                      <span className="text-white text-sm font-medium text-right">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="py-20 px-6 bg-[#080808]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4 text-center">
              System Doctrine
            </p>
            <h2 className="font-serif text-3xl font-medium text-white mb-16 text-center">
              Built on four principles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {PILLARS.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-8 hover:border-[#C6A55A]/30 transition-colors"
                >
                  <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-5">
                    <Icon className="w-5 h-5 text-[#C6A55A]" />
                  </div>
                  <h3 className="text-white font-medium text-lg mb-3">
                    {title}
                  </h3>
                  <p className="text-[#8A8A8A] text-sm leading-relaxed font-light">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4 text-center">
              Client Profiles
            </p>
            <h2 className="font-serif text-3xl font-medium text-white mb-16 text-center">
              Who engages The Milano Seal™
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  type: "Attorneys & Law Firms",
                  desc: "International counsel, citizenship attorneys, real estate firms, and immigration practitioners who need a reliable U.S. execution partner.",
                },
                {
                  type: "Private Clients",
                  desc: "Individuals navigating citizenship applications, property transactions, estate matters, and cross-border legal proceedings.",
                },
                {
                  type: "Corporate & Institutional",
                  desc: "Companies requiring notarized corporate documents, authenticated agreements, and apostilled records for international use.",
                },
              ].map(({ type, desc }) => (
                <div
                  key={type}
                  className="border border-[#2A2A2A] rounded-xl p-8"
                >
                  <h3 className="text-[#C6A55A] font-medium mb-4">{type}</h3>
                  <p className="text-[#8A8A8A] text-sm leading-relaxed font-light">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-[#080808] text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl font-medium text-white mb-6">
              Ready to begin?
            </h2>
            <p className="text-[#B0B0B0] mb-10 font-light">
              Every matter is reviewed before scheduling. Submit your intake and
              we will respond with scope confirmation and next steps.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#C6A55A] text-[#0A0A0A] font-medium text-lg rounded-sm hover:bg-[#D4BB7A] transition-all hover:shadow-[0_8px_30px_rgba(198,165,90,0.3)]"
            >
              Begin Secure Intake
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-[#8A8A8A] text-sm mt-6">
              Florida Notary Public · Remote Online Notary · Hague Route Reviewed
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
