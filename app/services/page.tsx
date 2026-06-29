import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileSignature, Stamp, Video, MapPin, Users, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Services | The Milano Seal™ — International Document Execution & Apostille Coordination",
  description:
    "International Document Execution, U.S.-Based Apostille Coordination, Remote Online Notarization, Florida Mobile Notary Coordination, Witness Coordination, and Secure Final Packet Release for U.S. documents intended for use abroad.",
  alternates: { canonical: "https://themilanoseal.com/services" },
};

const SERVICES = [
  {
    icon: FileSignature,
    title: "International Document Execution",
    tag: "U.S. Documents for International Use",
    body: "Structured support for U.S. documents intended for use abroad — intake review, execution pathway coordination, notarization support, apostille/authentication routing, custody visibility, and secure final packet release.",
    points: ["Power of attorney, affidavits, declarations", "Business authorization & corporate documents", "Real estate, family, and estate documents", "Attorney-prepared documents & filing packets"],
    note: "International use is subject to destination-country and receiving-authority requirements.",
  },
  {
    icon: Stamp,
    title: "U.S.-Based Apostille Coordination",
    tag: "Hague Apostille & Consular Authentication",
    body: "Apostille and authentication coordination for U.S. documents intended for international use. Routing depends on document origin, issuing authority, destination country, and receiving-authority requirements.",
    points: ["Hague Convention apostille routing", "Consular / authentication pathways", "Issuing-authority coordination", "Destination-country route review"],
    note: "Apostille coordination is subject to document origin, document type, destination country, issuing authority, and receiving-authority requirements.",
  },
  {
    icon: Video,
    title: "Remote Online Notarization",
    tag: "Eligible Remote Execution",
    body: "Remote Online Notarization support for eligible documents where RON is appropriate based on document type, signer location, jurisdiction, and receiving-authority requirements.",
    points: ["Identity-verified remote sessions", "Eligibility reviewed per document & destination", "Coordinated with execution pathway"],
    note: "Remote Online Notarization availability depends on document type, signer location, jurisdiction, and receiving authority.",
  },
  {
    icon: MapPin,
    title: "Florida Mobile Notary Coordination",
    tag: "In-Person Florida Execution Support",
    body: "Florida-based mobile notary coordination for eligible matters requiring in-person execution, signer presence, identity verification, witness coordination, or document packet control.",
    points: ["In-person signer presence & ID verification", "Witness coordination where required", "Document packet control"],
    note: "Mobile notary availability depends on location, scheduling, document type, signer requirements, and applicable notarial rules.",
  },
  {
    icon: Users,
    title: "Witness Coordination",
    tag: "Required-Witness Support",
    body: "Witness coordination for eligible document executions where witness presence is required by the document, jurisdiction, receiving authority, or execution pathway.",
    points: ["Witness presence arranged where required", "Aligned to document & jurisdiction rules"],
    note: "Witness requirements depend on the document, jurisdiction, execution method, and receiving-authority expectations. Witnesses do not provide legal advice.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Final Packet Release",
    tag: "Controlled International Release",
    body: "Final packet release is coordinated only after applicable review, payment, custody, and release controls are satisfied.",
    points: ["Payment, review, and custody controls", "Courier & destination-route controls", "Chain-of-custody visibility"],
    note: "Final acceptance is determined by the receiving authority.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="relative bg-[#050506]">
        <section className="relative px-4 sm:px-6 lg:px-8" style={{ paddingTop: "calc(var(--header-total-height) + 2.5rem)", paddingBottom: "4rem" }}>
          <div className="mx-auto max-w-5xl text-center">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ms-gold)]/70">Services</p>
            <h1 className="font-serif text-4xl leading-tight text-white sm:text-5xl">
              International Document Execution{" "}
              <span className="italic text-[var(--ms-gold)]">& Apostille Coordination</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/60">
              The Milano Seal™ coordinates U.S. document execution, remote online notarization, Florida mobile
              notary support, witness coordination, apostille/authentication routing, receiving-authority review,
              and secure international release for documents intended for use abroad.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/intake" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a1206]" style={{ background: "linear-gradient(180deg,#ECD79A,#C6A55A)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 22px rgba(198,165,90,0.25)" }}>
                Begin Secure Intake <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/countries" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/35 bg-black/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/85 transition-colors hover:border-[var(--ms-gold)]/60 hover:text-[var(--ms-gold)]">
                Explore Global Document Intelligence <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="rounded-2xl border border-[var(--ms-gold)]/18 p-6" style={{ background: "linear-gradient(180deg, rgba(12,12,14,0.92), rgba(7,7,8,0.9))", boxShadow: "0 16px 44px rgba(0,0,0,0.45)" }}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ms-gold)]/25">
                      <Icon className="h-4 w-4 text-[var(--ms-gold)]/80" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg text-white">{s.title}</h2>
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/55">{s.tag}</p>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-white/60">{s.body}</p>
                  <ul className="mt-3 grid gap-1.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[12.5px] text-white/55">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--ms-gold)]/70" />{p}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-[var(--ms-gold)]/10 pt-3 text-[11px] leading-relaxed text-white/35">{s.note}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Positioning block — not a discount notary */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--ms-gold)]/22 p-8 text-center sm:p-10" style={{ background: "linear-gradient(180deg, rgba(10,10,12,0.92), rgba(6,6,8,0.95))" }}>
            <h2 className="font-serif text-2xl text-white sm:text-3xl">Built for international document control, not commodity notarization</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/60">
              The Milano Seal™ is not positioned as a discount notary or marketplace. Our service model is built
              around structured intake, jurisdiction review, payment-gated execution, apostille/authentication
              routing, chain-of-custody visibility, and controlled final release.
            </p>
            <div className="mt-7">
              <Link href="/intake" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a1206]" style={{ background: "linear-gradient(180deg,#ECD79A,#C6A55A)" }}>
                Begin Secure Intake <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-[11px] leading-relaxed text-white/30">
              The Milano Seal™ coordinates U.S. document execution, remote online notarization, Florida mobile notary
              support, witness coordination, apostille/authentication routing, and international release coordination.
              Availability and acceptance depend on document type, jurisdiction, destination country, signer location,
              and receiving-authority requirements. This service does not constitute legal advice.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
