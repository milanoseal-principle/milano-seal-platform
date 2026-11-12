export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALLIANCE_BINDING_ADMIN_ROLES, listBindingAccounts, type BindingAccount, type BindingProfile } from "@/lib/alliance/accountBinding";
import { AccountBindingPanel } from "@/components/dashboard/alliance/AccountBindingPanel";

// Admin-only: link each Alliance sign-in account to its verified operator profile and manage its
// referral code. A partner cannot use the Alliance workspace until an administrator binds them.
export default async function AllianceAccountBindingPage() {
  const { role } = await requireDashboardAccess();
  const authorized = ALLIANCE_BINDING_ADMIN_ROLES.has(role);

  let data: { accounts: BindingAccount[]; profiles: BindingProfile[] } | null = null;
  if (authorized) {
    try {
      data = await listBindingAccounts(createAdminClient());
    } catch {
      data = null;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-1">
          <Link href="/dashboard/alliance">Alliance OS™</Link> — Partner Accounts
        </p>
        <h1 className="font-serif text-3xl text-foreground">Partner Account Binding</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Link each Alliance sign-in account to its verified operator profile. Eligibility, compliance and capabilities are read from the bound profile; every change here is recorded with your account.
        </p>
      </div>
      <div>
        {!authorized ? (
          <p role="alert" className="rounded-sm px-4 py-3 text-sm" style={{ border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37" }}>
            Account binding is limited to administrators. Your role can review referrals but cannot change partner identity.
          </p>
        ) : !data ? (
          <p role="alert" className="rounded-sm px-4 py-3 text-sm" style={{ border: "1px solid rgba(180,50,50,0.3)", color: "rgba(255,140,140,0.9)" }}>
            Partner accounts are unavailable right now. This is not an empty list: the account data could not be read. If this persists, confirm the Alliance identity database changes have been applied.
          </p>
        ) : (
          <AccountBindingPanel accounts={data.accounts} profiles={data.profiles} />
        )}
      </div>
    </div>
  );
}
