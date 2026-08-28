import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "The Milano Seal™",
    template: "%s",
  },
};

export default function ProfessionalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
