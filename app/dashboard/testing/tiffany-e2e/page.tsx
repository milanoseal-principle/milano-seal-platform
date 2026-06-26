import type { Metadata } from "next";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { E2EDemoShell } from "./_components/e2e-demo-shell";

export const metadata: Metadata = {
  title: "Tiffany E2E Demo — Milano Seal Operator",
  robots: { index: false, follow: false },
};

export default async function TiffanyE2EPage() {
  await requireDashboardAccess();

  const demoEnabled = process.env.MILANO_E2E_DEMO_MODE === "true";

  if (!demoEnabled) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="border border-yellow-400/40 bg-yellow-950/20 rounded-lg p-6 text-center">
          <p className="text-yellow-400 font-semibold text-sm uppercase tracking-widest mb-2">
            Demo Mode Disabled
          </p>
          <p className="text-muted-foreground text-sm">
            Set{" "}
            <code className="bg-muted px-1 rounded text-xs">
              MILANO_E2E_DEMO_MODE=true
            </code>{" "}
            in your environment to enable the Tiffany E2E demo harness.
          </p>
          <p className="text-muted-foreground text-xs mt-3">
            This page is never public and never indexed regardless of this flag.
          </p>
        </div>
      </div>
    );
  }

  return <E2EDemoShell />;
}
