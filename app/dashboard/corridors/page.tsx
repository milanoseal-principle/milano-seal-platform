export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadMatterEconomics } from "@/lib/economics/matterEconomics";
import { buildCorridorScaleDecisions } from "@/lib/corridor/scale-engine";
import { CorridorEngine } from "./CorridorEngine";

export const metadata = {
  title: "Corridor Command — The Milano Seal™",
  robots: { index: false },
};

export default async function CorridorsPage() {
  await requireDashboardAccess();
  const economics = await loadMatterEconomics();
  const corridors = buildCorridorScaleDecisions(economics.matters);

  return (
    <CorridorEngine
      corridors={corridors}
      generatedAt={economics.generatedAt}
      degraded={economics.degraded}
      warning={economics.warning}
    />
  );
}
