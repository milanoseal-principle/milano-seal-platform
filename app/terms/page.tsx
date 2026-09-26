import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | The Milano Seal™",
  description:
    "Terms of service for The Milano Seal™ document execution and apostille services.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-8">
            Terms of Service
          </h1>

          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Service Description
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              The Milano Seal™ provides U.S. document execution coordination,
              including Remote Online Notarization (RON), mobile notary
              coordination, apostille/authentication routing, custody, and
              release support. Nicholas Milano is a commissioned Florida Notary
              Public. Matter-specific eligibility, execution method, and
              receiving-authority requirements control the applicable path.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Payment Terms
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              Payments are processed through Wise. The governed payment schedule
              for a Matter controls scheduling, execution, and final release.
              Where the quoted Matter uses the standard split-payment structure,
              the initial required payment unlocks scheduling and the remaining
              balance must be verified before final international release.
              Pricing is determined from the canonical execution tier, route,
              approved add-ons, and applicable courier costs. Prices are quoted
              in USD.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Service Limitations
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              Our services are limited to notarization and apostille
              coordination. We do not provide legal guidance, and our services do
              not constitute a legal practice. Clients should consult with an
              attorney for legal guidance regarding their documents.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              International Acceptance
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              The Milano Seal coordinates the U.S. execution and authentication
              path using the document origin, signer posture, destination,
              available authority information, and Matter-specific facts.
              Apostille is only one possible route. Authentication, consular
              legalization, translation review, or other receiving-authority
              requirements may apply. Final acceptance remains subject to the
              receiving authority, and no acceptance outcome is guaranteed.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Identity Verification
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              All signers must verify their identity through our secure
              verification process. For Remote Online Notarization, this
              includes credential analysis and knowledge-based authentication as
              required by Florida law.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Cancellation and Refunds
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              Cancellations requested before execution begins are eligible for a
              full refund minus any processing fees. Once execution has
              commenced, refunds may be prorated based on services already
              rendered.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Limitation of Liability
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              The Milano Seal™ is not liable for any indirect, incidental,
              special, or consequential damages arising from the use of our
              services. Our liability is limited to the amount paid for the
              specific service in question.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Governing Law
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              These terms are governed by and construed in accordance with the
              laws of the State of Florida, without regard to its conflict of
              law provisions.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Contact
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              For questions about these Terms of Service, please contact us at
              contact@themilanoseal.com.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
