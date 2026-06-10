import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { SealImpressionReview } from "@/components/reviews/SealImpressionReview";

export const metadata: Metadata = {
  title: "Review The Milano Seal™ | Google Business Profile",
  description:
    "Share your experience with The Milano Seal on Google.",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg space-y-6">
          {/* Page heading */}
          <div className="text-center">
            <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-semibold mb-3">
              The Milano Seal™
            </p>
            <h1 className="font-serif text-3xl text-white mb-3">
              Seal the Experience
            </h1>
            <p className="text-[#8A8A8A] text-sm leading-relaxed max-w-sm mx-auto">
              Thank you for trusting The Milano Seal with your document matter.
            </p>
          </div>

          {/* Review card */}
          <SealImpressionReview isUnlocked={true} />

          {/* Footer disclaimer */}
          <p className="text-[#4A4A4A] text-xs text-center leading-relaxed">
            Please do not include private document details, passport numbers,
            account numbers, minor names, medical details, or confidential legal
            facts in public reviews.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
