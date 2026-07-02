import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  MILANO_PUBLIC_PROMISE,
  getRevenueCopyForAudience,
} from "@/data/milano-revenue-copy-system";

export const metadata: Metadata = {
  title:
    "Cross-Border Document Execution Support for International Counsel | The Milano Seal™",
  description:
    "How international lawyers and private-client advisors use The Milano Seal to coordinate U.S.-origin document execution, apostille/authentication routing, and controlled release.",
};

const lawyerCopy = getRevenueCopyForAudience("international_lawyer");

const LAWYER_USE_CASES: { title: string; body: string }[] = [
  {
    title: "Client Expectation Control",
    body: "Set clear, client-ready route expectations before execution begins, reducing back-and-forth on international document steps.",
  },
  {
    title: "U.S. Execution Coordination",
    body: "Coordinate U.S. notarization or RON for your client's U.S.-origin documents through a controlled, tracked process.",
  },
  {
    title: "Apostille & Authentication Routing",
    body: "Identify the apostille, authentication, or consular review pathway that applies to the receiving country.",
  },
  {
    title: "Private Client & HNWI Support",
    body: "Support HNWI/UHNWI clients, family offices, and private-client matters across assets, residency, banking, and estate documents.",
  },
  {
    title: "Controlled Release Trail",
    body: "Track controlled release and final packet readiness with a custody-aware delivery trail for documents used abroad.",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <section
        className="px-4 sm:px-6 pb-16"
        style={{
          paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 1.5rem)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <h1
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#C6A55A" }}
          >
            Cross-Border Document Execution Support for International Counsel
          </h1>

          {lawyerCopy?.subheadline ? (
            <p className="mt-5 text-[#8A8A8A] leading-relaxed max-w-3xl">
              {lawyerCopy.subheadline}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/access?interest=lawyer-pack"
              className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-[#0A0A0A] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C6A55A" }}
            >
              Request Lawyer Client Pack
            </Link>
            <Link
              href="/intake"
              className="inline-flex items-center justify-center rounded-md border border-[#C6A55A]/40 px-5 py-3 text-sm font-semibold text-[#C6A55A] transition-colors hover:bg-[#C6A55A]/10"
            >
              Begin Secure Intake
            </Link>
          </div>

          <h2
            className="mt-12 text-2xl font-semibold"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#C6A55A" }}
          >
            How International Lawyers Use The Milano Seal
          </h2>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAWYER_USE_CASES.map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-lg border border-white/10 bg-white/[0.02] p-5"
              >
                <h3
                  className="text-base font-semibold"
                  style={{
                    fontFamily: "var(--font-serif, serif)",
                    color: "#C6A55A",
                  }}
                >
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[#8A8A8A] leading-relaxed whitespace-normal break-words">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-[#C6A55A]/25 bg-[#C6A55A]/[0.04] p-5 sm:p-6">
            <p className="text-sm text-[#8A8A8A] leading-relaxed">
              {MILANO_PUBLIC_PROMISE}
            </p>
          </div>

          <p className="mt-10 text-xs text-[#8A8A8A] leading-relaxed">
            The Milano Seal is not a law firm. Routing snapshots remain subject
            to receiving-authority review.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
