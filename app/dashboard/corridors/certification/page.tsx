export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CorridorCertificationCenter } from "@/components/dashboard/CorridorCertificationCenter";

export const metadata = {
  title: "Corridor Certification Program — The Milano Seal™",
  robots: { index: false },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type CertStatus =
  | "UNCHARTED"
  | "DERIVED"
  | "OBSERVED"
  | "VERIFIED"
  | "CERTIFIED";

export interface PriorityCorridorDef {
  country: string;
  document: string;
  corridor: string;
  use_case: string;
  notes: string;
}

export interface PriorityCorridorCard extends PriorityCorridorDef {
  matter_count: number;
  avg_days: number | null;
  status: CertStatus;
}

export interface CertificationSummary {
  total: number;
  uncharted: number;
  derived: number;
  observed: number;
  verified: number;
  certified: number;
}

// ─── Static priority corridors ────────────────────────────────────────────────

const PRIORITY_CORRIDORS: PriorityCorridorDef[] = [
  {
    country: "Italy",
    document: "Birth Certificate",
    corridor: "USA → Italy",
    use_case: "Citizenship by descent, dual citizenship",
    notes: "Comune → Prefettura → Translation → Release",
  },
  {
    country: "Italy",
    document: "Power of Attorney",
    corridor: "USA → Italy",
    use_case: "Real estate, estate management, business",
    notes: "Notarization → Apostille → Translation (if notarized in Italian)",
  },
  {
    country: "Italy",
    document: "Marriage Certificate",
    corridor: "USA → Italy",
    use_case: "Citizenship, estate, property transfer",
    notes: "Comune di [Destination] → Apostille",
  },
  {
    country: "Portugal",
    document: "Birth Certificate",
    corridor: "USA → Portugal",
    use_case: "D7 Visa, citizenship, NHR regime",
    notes: "IRN → Conservatória → Apostille",
  },
  {
    country: "Portugal",
    document: "Criminal Background Check",
    corridor: "USA → Portugal",
    use_case: "D7 Visa application, residency",
    notes: "FBI Apostille → Sworn translation",
  },
  {
    country: "Mexico",
    document: "Corporate Resolution",
    corridor: "USA → Mexico",
    use_case: "Corporate formation, banking, contracts",
    notes: "SRE → Translation → Apostille",
  },
  {
    country: "Mexico",
    document: "Birth Certificate",
    corridor: "USA → Mexico",
    use_case: "Dual citizenship, family law, estate",
    notes: "Registro Civil → Apostille",
  },
  {
    country: "Spain",
    document: "Birth Certificate",
    corridor: "USA → Spain",
    use_case: "Citizenship by descent, residency",
    notes: "Civil Registry → Apostille → Translation",
  },
  {
    country: "Spain",
    document: "Affidavit",
    corridor: "USA → Spain",
    use_case: "Legal proceedings, property, residency",
    notes: "Notarization → Apostille → Sworn translation",
  },
  {
    country: "Germany",
    document: "Diploma/Degree",
    corridor: "USA → Germany",
    use_case: "Professional licensing, employment, residency",
    notes: "Kultusministerkonferenz → Apostille → Translation",
  },
  {
    country: "UAE",
    document: "Criminal Background Check",
    corridor: "USA → UAE",
    use_case: "Employment visa, residency",
    notes: "FBI Apostille → Embassy legalization (UAE non-Hague)",
  },
  {
    country: "Brazil",
    document: "Birth Certificate",
    corridor: "USA → Brazil",
    use_case: "Citizenship, estate, family law",
    notes: "Apostille → Sworn translation (Portuguese)",
  },
  {
    country: "Greece",
    document: "Birth Certificate",
    corridor: "USA → Greece",
    use_case: "Citizenship by descent",
    notes: "Apostille → Sworn translation",
  },
  {
    country: "France",
    document: "Power of Attorney",
    corridor: "USA → France",
    use_case: "Real estate, business, estate",
    notes: "Notarization → Apostille → Translation",
  },
];

function statusFromCount(n: number): CertStatus {
  if (n === 0) return "UNCHARTED";
  if (n === 1) return "DERIVED";
  if (n <= 4) return "OBSERVED";
  if (n <= 14) return "VERIFIED";
  return "CERTIFIED";
}

// ─── Server page ──────────────────────────────────────────────────────────────

export default async function CorridorCertificationPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  const { data: completedMatters } = await supabase
    .from("deals")
    .select(
      "destination_country, document_type, matter_status, apostille_at, completed_at, created_at, lane, total_price"
    )
    .in("matter_status", ["completed", "released"])
    .order("completed_at", { ascending: false });

  const matters = completedMatters ?? [];

  // Aggregate per corridor key
  const corridorStats = new Map<
    string,
    { count: number; total_days: number; count_with_days: number }
  >();
  for (const m of matters) {
    if (!m.destination_country || !m.document_type) continue;
    const key = `${m.destination_country}::${m.document_type}`;
    const existing = corridorStats.get(key) ?? {
      count: 0,
      total_days: 0,
      count_with_days: 0,
    };
    existing.count += 1;
    if (m.created_at && m.completed_at) {
      const days = Math.round(
        (new Date(m.completed_at).getTime() - new Date(m.created_at).getTime()) /
          86400000
      );
      if (days >= 0) {
        existing.total_days += days;
        existing.count_with_days += 1;
      }
    }
    corridorStats.set(key, existing);
  }

  // Build cards
  const cards: PriorityCorridorCard[] = PRIORITY_CORRIDORS.map((def) => {
    const key = `${def.country}::${def.document}`;
    const stats = corridorStats.get(key);
    const matter_count = stats?.count ?? 0;
    const avg_days =
      stats && stats.count_with_days > 0
        ? Math.round(stats.total_days / stats.count_with_days)
        : null;
    return {
      ...def,
      matter_count,
      avg_days,
      status: statusFromCount(matter_count),
    };
  });

  const summary: CertificationSummary = {
    total: PRIORITY_CORRIDORS.length,
    uncharted: cards.filter((c) => c.status === "UNCHARTED").length,
    derived: cards.filter((c) => c.status === "DERIVED").length,
    observed: cards.filter((c) => c.status === "OBSERVED").length,
    verified: cards.filter((c) => c.status === "VERIFIED").length,
    certified: cards.filter((c) => c.status === "CERTIFIED").length,
  };

  return <CorridorCertificationCenter cards={cards} summary={summary} />;
}
