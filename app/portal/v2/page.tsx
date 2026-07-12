import { redirect } from "next/navigation";

// Legacy compatibility route. The experimental "Portal 2.0" shell was never wired
// to authorized Matter data (see docs/architecture/MILANO_SEAL_FINAL_SYSTEM_MAP.md),
// so it carried no unique approved functionality. This route now forwards into the
// single canonical client portal at /portal. The components/portal2 shell is left
// in place for future reuse but is no longer an active parallel portal surface.
export const metadata = {
  title: "Matter Control Portal — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default function PortalV2CompatibilityPage() {
  redirect("/portal");
}
