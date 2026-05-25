import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CLOSED = ["completed", "closed", "delivered"];
const OPEN = [
  "new", "intake_received", "under_review", "compliance_review", "quoted",
  "awaiting_payment", "payment_confirmed", "scheduled", "in_execution",
  "apostille_processing", "courier_ready", "shipped",
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();

  const { data: allDeals } = await db
    .from("deals")
    .select("id, deal_id, client_name, destination_country, document_type, lane, total_price, deal_status, payment_status, created_at")
    .order("created_at", { ascending: false });

  const deals = allDeals ?? [];

  const countryMap = new Map<string, { count: number; closed: number; pipeline: number }>();
  deals.forEach(d => {
    const c = d.destination_country ?? "Unknown";
    const cur = countryMap.get(c) ?? { count: 0, closed: 0, pipeline: 0 };
    const price = d.total_price ?? 0;
    const status = d.deal_status ?? "";
    countryMap.set(c, {
      count: cur.count + 1,
      closed: cur.closed + (CLOSED.includes(status) ? price : 0),
      pipeline: cur.pipeline + (OPEN.includes(status) ? price : 0),
    });
  });
  const by_country = Array.from(countryMap.entries())
    .map(([country, v]) => ({ country, ...v }))
    .sort((a, b) => (b.closed + b.pipeline) - (a.closed + a.pipeline))
    .slice(0, 10);

  const docMap = new Map<string, { count: number; revenue: number }>();
  deals.forEach(d => {
    const t = d.document_type ?? "Unknown";
    const cur = docMap.get(t) ?? { count: 0, revenue: 0 };
    docMap.set(t, {
      count: cur.count + 1,
      revenue: cur.revenue + (CLOSED.includes(d.deal_status ?? "") ? (d.total_price ?? 0) : 0),
    });
  });
  const by_document_type = Array.from(docMap.entries())
    .map(([document_type, v]) => ({ document_type, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const laneMap = new Map<string, { count: number; closed: number; pipeline: number }>();
  deals.forEach(d => {
    const l = d.lane ?? "Standard";
    const cur = laneMap.get(l) ?? { count: 0, closed: 0, pipeline: 0 };
    const price = d.total_price ?? 0;
    const status = d.deal_status ?? "";
    laneMap.set(l, {
      count: cur.count + 1,
      closed: cur.closed + (CLOSED.includes(status) ? price : 0),
      pipeline: cur.pipeline + (OPEN.includes(status) ? price : 0),
    });
  });
  const by_lane = Array.from(laneMap.entries())
    .map(([lane, v]) => ({ lane, ...v }))
    .sort((a, b) => (b.closed + b.pipeline) - (a.closed + a.pipeline));

  const unpaid_matters = deals
    .filter(d =>
      OPEN.includes(d.deal_status ?? "") &&
      (d.payment_status === "unpaid" || d.payment_status === "pending" || !d.payment_status)
    )
    .slice(0, 10)
    .map(d => ({
      id: d.id,
      deal_id: d.deal_id,
      client_name: d.client_name,
      total_price: d.total_price ?? 0,
      deal_status: d.deal_status,
      created_at: d.created_at,
    }));

  const total_closed = deals.filter(d => CLOSED.includes(d.deal_status ?? "")).reduce((s, d) => s + (d.total_price ?? 0), 0);
  const total_pipeline = deals.filter(d => OPEN.includes(d.deal_status ?? "")).reduce((s, d) => s + (d.total_price ?? 0), 0);
  const total_unpaid = unpaid_matters.reduce((s, d) => s + d.total_price, 0);

  return NextResponse.json({ by_country, by_document_type, by_lane, unpaid_matters, total_closed, total_pipeline, total_unpaid });
}
