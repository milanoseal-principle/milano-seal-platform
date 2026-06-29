import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

// Secure review links are private, single-use/time-limited, and never indexed.
export const metadata: Metadata = {
  title: "Secure Review Link | The Milano Seal™",
  robots: { index: false, follow: false },
};

interface ReviewPageProps {
  params: Promise<{ token: string }>;
}

// Token-resolution against the review-links store is not yet wired. Until it is,
// this route returns a safe invalid/expired state rather than exposing an
// unfinished surface or echoing the token. No internal data is ever rendered here.
export default async function SecureReviewPage({ params }: ReviewPageProps) {
  await params; // token intentionally not surfaced

  return (
    <div className="min-h-screen bg-[#050506] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-[var(--ms-gold)]/20 bg-[#0b0b0d] p-8 text-center" style={{ boxShadow: "0 24px 70px rgba(0,0,0,0.5)" }}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ms-gold)]/35">
          <ShieldAlert size={22} className="text-[var(--ms-gold)]" />
        </div>
        <h1 className="font-serif text-xl text-white mb-2">This review link is invalid or has expired</h1>
        <p className="text-sm leading-relaxed text-white/55">
          Secure review links are private and time-limited. If you were expecting access to a matter,
          request a current link from your Milano Seal coordinator, or open your Secure Matter Portal.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Link href="/portal" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--ms-gold)]/35 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/85 transition-colors hover:border-[var(--ms-gold)]/60 hover:text-[var(--ms-gold)]">
            Open Secure Matter Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
