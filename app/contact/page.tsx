import { redirect } from "next/navigation";

export const metadata = {
  title: "Contact | The Milano Seal™",
  robots: { index: false, follow: true },
};

export default function ContactCompatibilityPage() {
  redirect("/intake?source=contact");
}
