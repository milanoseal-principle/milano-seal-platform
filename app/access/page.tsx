import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ACCESS_PRODUCTS } from "@/data/access-products";
import {
  MILANO_PUBLIC_PROMISE,
  MILANO_PAYMENT_SCHEDULING_LINE,
} from "@/data/milano-revenue-copy-system";

export const metadata: Metadata = {
  title: "Choose Your Milano Seal Access Path | The Milano Seal™",
  description:
    "Select a Milano Seal access path: route reports, lawyer packs, controlled matter deposits, concierge review, and network applications.",
};

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
            Choose Your Milano Seal Access Path
          </h1>

          <p className="mt-5 text-[#8A8A8A] leading-relaxed max-w-3xl">
            {MILANO_PUBLIC_PROMISE}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/intake"
              className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-[#0A0A0A] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C6A55A" }}
            >
              Begin Secure Intake
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACCESS_PRODUCTS.map((product) => (
              <div
                key={product.code}
                className="flex flex-col rounded-lg border border-white/10 bg-white/[0.02] p-5"
              >
                <h2
                  className="text-lg font-semibold"
                  style={{
                    fontFamily: "var(--font-serif, serif)",
                    color: "#C6A55A",
                  }}
                >
                  {product.label}
                </h2>
                <p className="mt-2 text-sm text-[#8A8A8A] leading-relaxed whitespace-normal break-words">
                  {product.description}
                </p>
                <p className="mt-4 text-sm font-medium text-white/90">
                  {product.priceLabel}
                </p>
                <div className="mt-5 pt-1">
                  <Link
                    href={product.ctaHref}
                    className="inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold text-[#0A0A0A] transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#C6A55A" }}
                  >
                    {product.ctaLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-[#C6A55A]/25 bg-[#C6A55A]/[0.04] p-5 sm:p-6">
            <p className="text-sm text-[#8A8A8A] leading-relaxed">
              {MILANO_PAYMENT_SCHEDULING_LINE}
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
