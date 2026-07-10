"use client";

import type { PipelineItem } from "@/lib/founder-os/types";
import { PipelineBoard } from "./PipelineBoard";

export function GovernmentOpportunityQueue({ items = [] }: { items?: PipelineItem[] }) {
  const scoped = items.filter((i) => i.channel === "government");
  return (
    <PipelineBoard
      title="Government Opportunity Queue"
      items={scoped}
      emptyLabel="No government opportunities tracked."
    />
  );
}
