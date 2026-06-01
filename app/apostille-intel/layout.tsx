import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apostille Intelligence Tool | The Milano Seal™",
  description:
    "Determine apostille requirements, timelines, and rejection triggers for any country and document type. Florida-based international document execution specialists.",
};

export default function ApostilleIntelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
