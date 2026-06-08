import { ReactNode } from "react";

export const metadata = {
  title: "Alliance Partner Portal | The Milano Seal™",
  robots: { index: false, follow: false },
};

// Layout is minimal — each gated page wraps itself in AllianceShell
// to allow server-component data fetching for partner context.
// The public /alliance page has no shell.
export default function AllianceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
