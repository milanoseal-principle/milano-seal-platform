import { ReactNode } from "react";
import { PortalFrame } from "@/components/portal/portal-frame";
import { PortalClientErrorBoundary } from "@/components/portal/portal-client-error-boundary";
import { createClient } from "@/lib/supabase/server";
import {
  getHomeRouteForRole,
  normalizeUserRole,
} from "@/lib/auth/roleRedirect";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Private Matter Access | The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/portal");

  // Authorization is derived only from service-controlled app_metadata and the
  // canonical Milano Seal role map. Client Portal access is client-only.
  const rawRole = (user.app_metadata?.role as string | undefined) ?? null;
  const role = normalizeUserRole(rawRole);

  if (role !== "client") {
    redirect(getHomeRouteForRole(rawRole));
  }

  return (
    <PortalClientErrorBoundary>
      <PortalFrame>{children}</PortalFrame>
    </PortalClientErrorBoundary>
  );
}
