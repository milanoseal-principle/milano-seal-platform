import { redirect } from "next/navigation";

export const metadata = {
  title: "Professional Coordination | The Milano Seal™",
  robots: { index: false, follow: true },
};

export default function ProfessionalsCompatibilityPage() {
  redirect("/professional");
}
