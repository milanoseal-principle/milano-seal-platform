"use client";

import type { PipelineItem } from "@/lib/founder-os/types";
import { PipelineBoard } from "./PipelineBoard";

export function InternationalOpportunityQueue({ items = [] }: { items?: PipelineItem[] }) {
  const scoped = items.filter((i) => i.channel === "international");
  return (
    <PipelineBoard
      title="International Opportunity Queue"
      items={scoped}
      emptyLabel="No international opportunities tracked."
    />
  );
}
