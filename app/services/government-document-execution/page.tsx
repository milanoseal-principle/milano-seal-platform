import Link from "next/link";
import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";
import { getGovernmentServices } from "@/lib/government/governmentServicesRegistry";

export const metadata: Metadata = {
  title: "Government Document Execution & Compliance Services | The Milano Seal™",
  description:
    "Structured government, public-sector, and agency-adjacent document execution: intake, identity coordination, mobile or remote execution when eligible, apostille and authentication coordination, and secure release tracking.",
  alternates: {
    canonical: "https://themilanoseal.com/services/government-document-execution",
  },
};

const customerTypes = [
  "County and city governments",
  "School districts, community colleges, and public universities",
  "Special districts and housing authorities",
  "Transit and airport authorities",
  "Economic development agencies",
  "Courts and public defender offices",
  "State agencies and public procurement offices",
  "Public hospitals and emergency management offices",
];

export default function GovernmentDocumentExecutionPage() {
  const services = getGovernmentServices();

  return (
    <ServicePageLayout
      h1="Government Document Execution & Compliance Services"
      intro="The Milano Seal™ supports government, public-sector, and agency-adjacent document execution workflows through structured intake, identity coordination, mobile or remote execution when eligible, apostille/authentication coordination when required, secure release tracking, and professional document handling."
      sections={[
        {
          title: "Capabilities",
          items: services.map((s) => s.publicSummary),
        },
        {
          title: "Who We Serve",
          items: customerTypes,
        },
        {
          title: "How Engagements Work",
          items: [
            "Structured secure intake to review the document path.",
            "Identity coordination and witness coordination when required.",
            "Mobile or remote online execution when the document and jurisdiction are eligible.",
            "Apostille or authentication coordination when a receiving authority requires it.",
            "Secure release tracking and professional document handling.",
            "Final acceptance remains subject to the receiving authority.",
          ],
        },
      ]}
      disclaimers={[
        "The Milano Seal™ does not provide legal advice, government approval guarantees, procurement guarantees, or guaranteed acceptance by any agency, court, institution, or receiving authority.",
        "Descriptions of the organizations we serve are illustrative of who these workflows are designed for and are not statements of existing clients or engagements.",
      ]}
    >
      <div className="mt-8 rounded-3xl border border-amber-300/15 bg-black/50 p-6 text-sm leading-7 text-stone-300">
        <p>
          Public-sector engagements are handled through the same payment-gated,
          custody-aware workflow used across The Milano Seal™. Scheduling unlocks
          after intake review, quote acceptance, and payment confirmation.
        </p>
        <Link
          href="/intake"
          className="mt-6 inline-flex items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10 px-8 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
        >
          Begin Secure Intake
        </Link>
      </div>
    </ServicePageLayout>
  );
}
