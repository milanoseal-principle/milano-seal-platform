<<<<<<< HEAD
import { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  robots: { index: true, follow: true },
};

export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "#060608", minHeight: "100vh", color: "#F6F1E6" }}>
      <div style={{ maxWidth: 768, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/learn"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em",
              textTransform: "uppercase", color: "#A8A29A",
              textDecoration: "none",
            }}
          >
            ← All Guides
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
=======
import { Metadata } from "next";
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
>>>>>>> claude/funny-maxwell-hlxQN
}
