import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DestinationIntelligenceResponse, DestinationIntelligenceItem } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["admin", "ops_manager", "finance", "founder_admin"]);

const CANONICAL_DESTINATIONS = [
  { country: "Italy",    slug: "italy",    routeLabel: "Florida → Italy",    nodeType: "HAGUE",     protocol: "Hague Convention" },
  { country: "Spain",    slug: "spain",    routeLabel: "Florida → Spain",    nodeType: "HAGUE",     protocol: "Hague Convention" },
  { country: "Portugal", slug: "portugal", routeLabel: "Florida → Portugal", nodeType: "HAGUE",     protocol: "Hague Convention" },
  { country: "Greece",   slug: "greece",   routeLabel: "Florida → Greece",   nodeType: "HAGUE",     protocol: "Hague Convention" },
  { country: "Brazil",   slug: "brazil",   routeLabel: "Florida → Brazil",   nodeType: "HAGUE",     protocol: "Hague Convention" },
  { country: "France",   slug: "france",   routeLabel: "Florida → France",   nodeType: "HAGUE",     protocol: "Hague Convention" },
  { country: "Germany",  slug: "germany",  routeLabel: "Florida → Germany",  nodeType: "HAGUE",     protocol: "Hague Convention" },
  { country: "UAE",      slug: "uae",      routeLabel: "Florida → UAE",      nodeType: "CONSULAR",  protocol: "Consular Authentication" },
  { country: "Mexico",   slug: "mexico",   routeLabel: "Florida → Mexico",   nodeType: "CONSULAR",  protocol: "Consular Authentication" },
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";
  if (!ALLOWED_ROLES.has(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  // Query deals table grouped by destination country
  // Safe fields only: never return margin, internal_notes, label_url, storage_path
  const { data: deals } = await admin
    .from("deals")
    .select("id, destination_country, deal_status, payment_status, updated_at")
    .not("destination_country", "is", null);

  const destinations: DestinationIntelligenceItem[] = CANONICAL_DESTINATIONS.map((dest) => {
    const base: DestinationIntelligenceItem = {
      ...dest,
      activeMatters: 0,
      awaitingPayment: 0,
      apostillePending: 0,
      courierReleased: 0,
      completed: 0,
      latestMatter: null,
    };

    if (!deals?.length) return base;

    const matched = deals.filter((d) => {
      const dc = (d.destination_country ?? "").toLowerCase();
      return dc === dest.slug || dc === dest.country.toLowerCase();
    });

    if (!matched.length) return base;

    let latestUpdated = "";

    for (const d of matched) {
      const status = d.deal_status ?? "";

      if (!["cancelled", "refunded", "completed", "closed"].includes(status)) {
        base.activeMatters++;
      }
      if (d.payment_status === "unpaid" || d.payment_status === "awaiting_payment" || status === "awaiting_payment") {
        base.awaitingPayment++;
      }
      if (status === "apostille_processing") {
        base.apostillePending++;
      }
      if (status === "courier_ready" || status === "shipped") {
        base.courierReleased++;
      }
      if (status === "completed" || status === "closed" || status === "delivered") {
        base.completed++;
      }

      if (!latestUpdated || d.updated_at > latestUpdated) {
        latestUpdated = d.updated_at;
        base.latestMatter = {
          id: d.id,
          status: d.deal_status ?? "unknown",
          updatedAt: d.updated_at,
        };
      }
    }

    return base;
  });

  const response: DestinationIntelligenceResponse = { destinations };
  return NextResponse.json(response);
}
