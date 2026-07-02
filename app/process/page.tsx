import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ProcessExperience } from "@/components/process/ProcessExperience";

export const metadata: Metadata = {
  title: "How It Works | The Milano Seal™",
  description: "The Milano Seal execution process.",
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
