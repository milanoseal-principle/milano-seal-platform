import { DataSourceStatusCard } from "@/components/dashboard/DataSourceStatusCard";
import { OperatorNextAction } from "@/components/dashboard/OperatorNextAction";
export default function SalesLabPage(){return <main className="space-y-6"><h1 className="font-serif text-3xl">Sales Intelligence Lab</h1><p className="text-muted-foreground">Internal sales intelligence. No fake metrics or fake revenue.</p><DataSourceStatusCard moduleName="Sales Intelligence Lab" status="planned" /><OperatorNextAction action="Attach qualified opportunities back to deals and referral intelligence." /></main>}
