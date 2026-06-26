import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PortalClient } from "@/components/portal/portal-client";

export const metadata: Metadata = {
  title: "Matter Control Portal — The Milano Seal™",
  description: "Access your matter status and documents.",
  robots: { index: false, follow: false },
};

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 10) return notFound();

  const supabase = createAdminClient();
  const { data: deal } = await supabase
    .from("deals")
    .select(
      "id, email, client_name, status, execution_tier, amount, country, document, payment_status, invoice_status, invoice_retainer, invoice_balance, payment_link, balance_payment_link, balance_payment_status, created_at",
    )
    .eq("access_token", token)
    .single();

  if (!deal) return notFound();

  return <PortalClient token={token} deal={deal} />;
}
