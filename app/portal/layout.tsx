import { ReactNode } from "react";
import { PortalFrame } from "@/components/portal/portal-frame";

export const metadata = {
  title: "Matter Control Portal | The Milano Seal™",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalFrame>{children}</PortalFrame>;
}
