import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Private Matter Access | The Milano Seal™",
  robots: { index: false, follow: false },
};

// Public navigation resolves to the canonical, session/role-protected portal.
// Do not render sample Matters, payment states or document panels before access.
export default function SecurePortalPage() {
  redirect("/portal");
}
