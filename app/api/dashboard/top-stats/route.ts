import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("deals")
    .select("destination_country, document_type");

  const deals = rows ?? [];

  // Top countries
  const countryMap = new Map<string, number>();
  for (const d of deals) {
    if (!d.destination_country) continue;
    countryMap.set(d.destination_country, (countryMap.get(d.destination_country) ?? 0) + 1);
  }
  const topCountries = Array.from(countryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Top documents
  const docMap = new Map<string, number>();
  for (const d of deals) {
    if (!d.document_type) continue;
    docMap.set(d.document_type, (docMap.get(d.document_type) ?? 0) + 1);
  }
  const topDocuments = Array.from(docMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return NextResponse.json({ topCountries, topDocuments });
}
