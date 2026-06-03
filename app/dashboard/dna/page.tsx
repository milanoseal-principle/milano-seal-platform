export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ExecutionDNA } from "@/components/dashboard/ExecutionDNA";

export const metadata = {
  title: "Execution DNA — The Milano Seal™",
  robots: { index: false },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CorridorDNA {
  corridor_key: string;
  country: string;
  document_type: string;
  matter_count: number;
  avg_days_to_complete: number | null;
  fastest_days: number | null;
  slowest_days: number | null;
  apostille_rate: number;
  translation_rate: number;
  avg_value: number;
  lane_distribution: Record<string, number>;
  status: "single" | "emerging" | "established" | "proven";
}

export interface DNAResult {
  total_completed: number;
  total_countries: number;
  total_corridors: number;
  corridors: CorridorDNA[];
  top_corridor: CorridorDNA | null;
  fastest_corridor: CorridorDNA | null;
  global_avg_days: number | null;
  global_avg_value: number;
  lane_efficiency: Record<string, { count: number; avg_days: number | null }>;
}

// ─── DNA Extraction ───────────────────────────────────────────────────────────

interface CompletedMatter {
  id: string;
  destination_country: string | null;
  document_type: string | null;
  lane: string | null;
  total_price: number | null;
  payment_status: string | null;
  matter_status: string | null;
  apostille_required: boolean | null;
  translation: boolean | null;
  created_at: string | null;
  executed_at: string | null;
  apostille_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

function corridorStatus(count: number): CorridorDNA["status"] {
  if (count >= 15) return "proven";
  if (count >= 5) return "established";
  if (count >= 2) return "emerging";
  return "single";
}

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  if (isNaN(diff) || diff < 0) return null;
  return diff / (1000 * 60 * 60 * 24);
}

function extractExecutionDNA(
  completedMatters: CompletedMatter[] | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _rejectionEvents: unknown[] | null
): DNAResult {
  const empty: DNAResult = {
    total_completed: 0,
    total_countries: 0,
    total_corridors: 0,
    corridors: [],
    top_corridor: null,
    fastest_corridor: null,
    global_avg_days: null,
    global_avg_value: 0,
    lane_efficiency: {},
  };

  if (!completedMatters || completedMatters.length === 0) return empty;

  // Group by corridor key
  const groups: Record<string, CompletedMatter[]> = {};
  for (const m of completedMatters) {
    const country = m.destination_country || "Unknown";
    const docType = m.document_type || "Unknown";
    const key = `${country}::${docType}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }

  const corridors: CorridorDNA[] = Object.entries(groups).map(
    ([key, matters]) => {
      const [country, document_type] = key.split("::");
      const days = matters
        .map((m) => daysBetween(m.created_at, m.completed_at))
        .filter((d): d is number => d !== null);
      const avg_days_to_complete =
        days.length > 0 ? days.reduce((s, d) => s + d, 0) / days.length : null;
      const fastest_days = days.length > 0 ? Math.min(...days) : null;
      const slowest_days = days.length > 0 ? Math.max(...days) : null;

      const apostille_rate =
        (matters.filter((m) => m.apostille_required).length / matters.length) *
        100;
      const translation_rate =
        (matters.filter((m) => m.translation).length / matters.length) * 100;

      const values = matters
        .map((m) => Number(m.total_price) || 0)
        .filter((v) => v > 0);
      const avg_value =
        values.length > 0
          ? values.reduce((s, v) => s + v, 0) / values.length
          : 0;

      const lane_distribution: Record<string, number> = {};
      for (const m of matters) {
        const lane = m.lane || "standard";
        lane_distribution[lane] = (lane_distribution[lane] || 0) + 1;
      }

      return {
        corridor_key: key,
        country,
        document_type,
        matter_count: matters.length,
        avg_days_to_complete:
          avg_days_to_complete !== null
            ? Math.round(avg_days_to_complete * 10) / 10
            : null,
        fastest_days:
          fastest_days !== null ? Math.round(fastest_days * 10) / 10 : null,
        slowest_days:
          slowest_days !== null ? Math.round(slowest_days * 10) / 10 : null,
        apostille_rate: Math.round(apostille_rate),
        translation_rate: Math.round(translation_rate),
        avg_value: Math.round(avg_value),
        lane_distribution,
        status: corridorStatus(matters.length),
      };
    }
  );

  corridors.sort((a, b) => b.matter_count - a.matter_count);

  // Global stats
  const allDays = corridors
    .map((c) => c.avg_days_to_complete)
    .filter((d): d is number => d !== null);
  const global_avg_days =
    allDays.length > 0
      ? Math.round(
          (allDays.reduce((s, d) => s + d, 0) / allDays.length) * 10
        ) / 10
      : null;

  const allValues = completedMatters
    .map((m) => Number(m.total_price) || 0)
    .filter((v) => v > 0);
  const global_avg_value =
    allValues.length > 0
      ? Math.round(allValues.reduce((s, v) => s + v, 0) / allValues.length)
      : 0;

  // Lane efficiency
  const laneGroups: Record<
    string,
    { days: number[]; count: number }
  > = {};
  for (const m of completedMatters) {
    const lane = m.lane || "standard";
    if (!laneGroups[lane]) laneGroups[lane] = { days: [], count: 0 };
    laneGroups[lane].count++;
    const d = daysBetween(m.created_at, m.completed_at);
    if (d !== null) laneGroups[lane].days.push(d);
  }
  const lane_efficiency: Record<
    string,
    { count: number; avg_days: number | null }
  > = {};
  for (const [lane, { days, count }] of Object.entries(laneGroups)) {
    const avg =
      days.length > 0
        ? Math.round(
            (days.reduce((s, d) => s + d, 0) / days.length) * 10
          ) / 10
        : null;
    lane_efficiency[lane] = { count, avg_days: avg };
  }

  const top_corridor = corridors[0] ?? null;
  const fastest_corridor =
    corridors
      .filter((c) => c.avg_days_to_complete !== null)
      .sort(
        (a, b) =>
          (a.avg_days_to_complete as number) - (b.avg_days_to_complete as number)
      )[0] ?? null;

  return {
    total_completed: completedMatters.length,
    total_countries: new Set(
      completedMatters.map((m) => m.destination_country).filter(Boolean)
    ).size,
    total_corridors: corridors.length,
    corridors,
    top_corridor,
    fastest_corridor,
    global_avg_days,
    global_avg_value,
    lane_efficiency,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DNAPage() {
  await requireDashboardAccess();

  let dna: DNAResult = {
    total_completed: 0,
    total_countries: 0,
    total_corridors: 0,
    corridors: [],
    top_corridor: null,
    fastest_corridor: null,
    global_avg_days: null,
    global_avg_value: 0,
    lane_efficiency: {},
  };

  try {
    const supabase = createAdminClient();

    const [{ data: completedMatters }, { data: rejectionEvents }] =
      await Promise.all([
        supabase
          .from("deals")
          .select(
            `id, destination_country, document_type, lane,
             total_price, payment_status, matter_status,
             apostille_required, translation,
             created_at, executed_at, apostille_at, shipped_at, completed_at,
             notes`
          )
          .in("matter_status", ["completed", "released"])
          .order("completed_at", { ascending: false }),
        supabase
          .from("operator_event_log")
          .select("event_type, metadata, created_at")
          .eq("event_type", "REJECTION_LOGGED")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

    dna = extractExecutionDNA(
      completedMatters as CompletedMatter[] | null,
      rejectionEvents
    );
  } catch {
    // Safe fallback — dna stays empty
  }

  return <ExecutionDNA dna={dna} />;
}
