import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, Globe, FileCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Nicholas Milano — U.S. International Document Execution Liaison",
  description:
    "Nicholas Milano is a Florida-licensed Notary Public and RON specialist operating as a U.S. international document execution liaison for clients and counsel worldwide.",
};

export default function FounderPage() {
  return (
    <>
      <Header />
      <main className="bg-[#0A0A0A] text-white min-h-screen">
        {/* Hero */}
        <section className="relative pt-32 pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-6">
                  The Operator
                </p>
                <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-4 leading-tight">
                  Nicholas Milano
                </h1>
                <p className="text-[#C6A55A] text-sm tracking-wide mb-8">
                  U.S. International Document Execution Liaison
                </p>
                <div className="w-12 h-px bg-[#C6A55A] mb-8 opacity-60" />
                <div className="space-y-5 text-[#B0B0B0] font-light leading-relaxed">
                  <p>
                    I built The Milano Seal™ because the international document
                    market has a structural problem: the gap between basic
                    notarization and full legal coordination is where most
                    matters break down.
                  </p>
                  <p>
                    Attorneys working across borders need a reliable U.S.
                    execution partner. Private clients navigating citizenship,
                    property, or estate matters need someone who understands
                    both the procedural requirements and the human stakes
                    involved.
                  </p>
                  <p>
                    My role is precise coordination — not just a signature. I
                    manage the full execution chain from intake through
                    apostille delivery, with the same standard on every
                    engagement.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-8">
                  {[
                    "Florida Notary #668288",
                    "RON Certified",
                    "Hague Convention Compliant",
                  ].map((c) => (
                    <span
                      key={c}
                      className="px-4 py-2 bg-[#111111] border border-[#2A2A2A] rounded-full text-xs text-[#C6A55A] tracking-wide"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#2A2A2A]">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
                  <Image
                    src="/nicholas-milano.jpeg"
                    alt="Nicholas Milano — Founder, The Milano Seal"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-20">
                    <div className="bg-[#0A0A0A]/90 backdrop-blur-sm border border-[#2A2A2A] rounded-lg p-4">
                      <p className="text-[#C6A55A] font-medium mb-1">
                        Nicholas Milano
                      </p>
                      <p className="text-sm text-[#B0B0B0]">
                        Founder · The Milano Seal™
                      </p>
                      <p className="text-xs text-[#B0B0B0]/60 mt-1">
                        Florida Notary #668288 · RON Specialist
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credentials */}
        <section className="py-20 px-6 bg-[#080808]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4 text-center">
              Credentials & Scope
            </p>
            <h2 className="font-serif text-3xl font-medium text-white mb-16 text-center">
              The execution record
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  label: "Licensed Authority",
                  items: [
                    "Florida Notary Public #668288",
                    "Remote Online Notary (RON)",
                    "Commissioned through 2029",
                    "E&O Insurance Active",
                  ],
                },
                {
                  icon: Globe,
                  label: "International Reach",
                  items: [
                    "Apostille for 21+ countries",
                    "Hague Convention compliance",
                    "FL DOS direct submission",
                    "Multi-country coordination",
                  ],
                },
                {
                  icon: FileCheck,
                  label: "Document Expertise",
                  items: [
                    "Power of Attorney",
                    "Affidavits (all types)",
                    "Immigration documents",
                    "Corporate + estate records",
                  ],
                },
              ].map(({ icon: Icon, label, items }) => (
                <div
                  key={label}
                  className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-8"
                >
                  <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-5">
                    <Icon className="w-5 h-5 text-[#C6A55A]" />
                  </div>
                  <h3 className="text-white font-medium mb-4">{label}</h3>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-[#8A8A8A]"
                      >
                        <div className="w-1 h-1 rounded-full bg-[#C6A55A] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-6">
              Operating Doctrine
            </p>
            <blockquote className="font-serif text-2xl md:text-3xl text-white italic leading-relaxed mb-8">
              "Every matter is a chain of decisions. My job is to make every
              decision correctly — from the first document review to the final
              delivery confirmation."
            </blockquote>
            <p className="text-[#8A8A8A] text-sm">— Nicholas Milano, Founder</p>
            <div className="w-12 h-px bg-[#C6A55A] mx-auto mt-8 opacity-40" />
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-[#080808] text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl font-medium text-white mb-6">
              Work with Nicholas directly
            </h2>
            <p className="text-[#B0B0B0] mb-10 font-light">
              Every engagement is personally reviewed and coordinated. Submit
              your matter and receive a structured response within one business
              day.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#C6A55A] text-[#0A0A0A] font-medium text-lg rounded-sm hover:bg-[#D4BB7A] transition-all"
            >
              Begin Execution
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
