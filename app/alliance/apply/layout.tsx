import type { Metadata } from "next";

// /alliance/apply is the PUBLIC partner application funnel — keep it indexable,
// overriding the private noindex set on the parent app/alliance/layout.tsx.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function AllianceApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
