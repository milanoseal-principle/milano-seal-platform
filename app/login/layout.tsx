import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Secure Access | The Milano Seal™",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Link
        href="/forgot-password?next=/portal"
        style={{
          position: "fixed",
          left: "50%",
          bottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
          transform: "translateX(-50%)",
          zIndex: 10000,
          minHeight: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 14px",
          borderRadius: 999,
          border: "1px solid rgba(198,165,90,.22)",
          background: "rgba(7,5,4,.88)",
          backdropFilter: "blur(12px)",
          color: "rgba(198,165,90,.82)",
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        Forgot password?
      </Link>
    </>
  );
}
