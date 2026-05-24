import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | The Milano Seal™",
  description:
    "Privacy policy for The Milano Seal™ document execution and apostille services.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-8">
            Privacy Policy
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
              Information We Collect
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              We collect information you provide directly to us, including your
              name, email address, phone number, country of residence, and
              document details necessary to provide our document execution and
              apostille coordination services.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              How We Use Your Information
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              We use the information we collect to provide, maintain, and
              improve our services, process transactions, communicate with you
              about your matters, and comply with legal obligations related to
              notarization and document authentication.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Information Security
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. All data is encrypted in
              transit and at rest.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Data Retention
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              We retain your personal information for as long as necessary to
              provide our services and comply with legal obligations.
              Notarization records are maintained in accordance with Florida
              state law requirements.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Your Rights
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              You have the right to access, correct, or delete your personal
              information. You may also request a copy of your data or object to
              certain processing activities. To exercise these rights, please
              contact us.
            </p>

            <h2 className="font-serif text-xl font-medium text-white mt-8 mb-4">
              Contact Us
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed mb-6">
              If you have any questions about this Privacy Policy, please
              contact us at contact@themilanoseal.com.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
