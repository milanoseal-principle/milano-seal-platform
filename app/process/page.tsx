import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ProcessExperience } from "@/components/process/ProcessExperience";

export const metadata: Metadata = {
  title: "International Document Execution Process | The Milano Seal™",
  description:
    "Follow the controlled Milano Seal execution pathway from intake and jurisdiction review through payment authorization, execution, apostille or authentication, custody, courier release, and delivery.",
};

export default function ProcessPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#050507]">
        <ProcessExperience />
      </main>
      <Footer />
    </>
  );
}
