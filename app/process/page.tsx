import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ProcessExperience } from "@/components/process/ProcessExperience";

export const metadata: Metadata = {
  title: "How It Works — Execution Process | The Milano Seal™",
  description:
    "The Milano Seal™ six-stage execution process: matter intake, compliance review, payment-gated execution, document execution, chain-of-custody visibility, and structured international release.",
  alternates: { canonical: "https://themilanoseal.com/process" },
};

export default function ProcessPage() {
  return (
    <>
      <Header />
      <main>
        <ProcessExperience />
      </main>
      <Footer />
    </>
  );
}
