import { notFound } from "next/navigation";
import { DASHBOARD_MODULES } from "@/lib/dashboard-modules";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Module page components
import { DealsModule } from "@/components/dashboard/modules/deals";
import { KpiModule } from "@/components/dashboard/modules/kpi";
import { LeadsModule } from "@/components/dashboard/modules/leads";
import { ProspectsModule } from "@/components/dashboard/modules/prospects";
import { ApostilleModule } from "@/components/dashboard/modules/apostille";
import { ScriptsModule } from "@/components/dashboard/modules/scripts";
import { EmailsModule } from "@/components/dashboard/modules/emails";
import { ReferralModule } from "@/components/dashboard/modules/referral";
import { ContentModule } from "@/components/dashboard/modules/content";
import { AdsModule } from "@/components/dashboard/modules/ads";
import { ReviewsModule } from "@/components/dashboard/modules/reviews";
import { ComplianceModule } from "@/components/dashboard/modules/compliance";
import { PricingModule } from "@/components/dashboard/modules/pricing";
import { RunbookModule } from "@/components/dashboard/modules/runbook";
import { ClientsModule } from "@/components/dashboard/modules/clients";
import { FinancialsModule } from "@/components/dashboard/modules/financials";
import { ForecastModule } from "@/components/dashboard/modules/forecast";
import { IntelligenceModule } from "@/components/dashboard/modules/intelligence";
import { CountriesModule } from "@/components/dashboard/modules/countries";
import { DocumentsModule } from "@/components/dashboard/modules/documents";
import { SeoModule } from "@/components/dashboard/modules/seo";
import { LanesModule } from "@/components/dashboard/modules/lanes";
import { LegalModule } from "@/components/dashboard/modules/legal";
import { CredentialsModule } from "@/components/dashboard/modules/credentials";
import { IdeasModule } from "@/components/dashboard/modules/ideas";
import { AssetsModule } from "@/components/dashboard/modules/assets";
import { AutomationModule } from "@/components/dashboard/modules/automation";

const MODULE_MAP: Record<string, React.ComponentType<any>> = {
  deals: DealsModule,
  kpi: KpiModule,
  leads: LeadsModule,
  prospects: ProspectsModule,
  apostille: ApostilleModule,
  scripts: ScriptsModule,
  emails: EmailsModule,
  referral: ReferralModule,
  content: ContentModule,
  ads: AdsModule,
  reviews: ReviewsModule,
  compliance: ComplianceModule,
  pricing: PricingModule,
  runbook: RunbookModule,
  clients: ClientsModule,
  financials: FinancialsModule,
  forecast: ForecastModule,
  intelligence: IntelligenceModule,
  countries: CountriesModule,
  documents: DocumentsModule,
  seo: SeoModule,
  lanes: LanesModule,
  legal: LegalModule,
  credentials: CredentialsModule,
  ideas: IdeasModule,
  assets: AssetsModule,
  automation: AutomationModule,
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const ModuleComponent = MODULE_MAP[module];
  if (!ModuleComponent) return notFound();

  const supabase = createAdminClient();
  const mod = DASHBOARD_MODULES.find((m) => m.route === module);

  // Load data from Supabase where relevant
  let data: any = {};
  if (module === "deals") {
    const { data: deals } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    data = { deals: deals || [] };
  }
  if (module === "clients") {
    const { data: clients } = await supabase
      .from("deals")
      .select(
        "client_name, email, country, execution_tier, amount, payment_status, created_at",
      )
      .order("created_at", { ascending: false });
    data = { clients: clients || [] };
  }
  if (module === "kpi") {
    const { data: deals } = await supabase
      .from("deals")
      .select("amount, payment_status, status, execution_tier, created_at");
    data = { deals: deals || [] };
  }
  if (module === "forecast") {
    const { data: deals } = await supabase
      .from("deals")
      .select("deal_id, client_name, status, deal_status, amount, created_at")
      .not("status", "in", '("completed","lost")')
      .order("created_at", { ascending: false })
      .limit(200);
    data = { deals: deals || [] };
  }
  if (module === "financials") {
    const { data: deals } = await supabase
      .from("deals")
      .select(
        "id, deal_id, client_name, execution_tier, base_price, requires_apostille, urgency, amount, invoice_subtotal, invoice_retainer, invoice_balance, payment_status, payment_amount_received, balance_payment_status, balance_amount_received, refund_amount, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    data = { deals: deals || [] };
  }

  return <ModuleComponent mod={mod} data={data} />;
}
