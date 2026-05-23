import { ReactNode } from "react";
import { PortalFrame } from "@/components/portal/portal-frame";

export const metadata = {
  title: "Private Matter Access | The Milano Seal™",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalFrame>{children}</PortalFrame>;
}
