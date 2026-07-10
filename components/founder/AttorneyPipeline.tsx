"use client";

import type { PipelineItem } from "@/lib/founder-os/types";
import { PipelineBoard } from "./PipelineBoard";

export function AttorneyPipeline({ items = [] }: { items?: PipelineItem[] }) {
  const scoped = items.filter((i) => i.channel === "attorney");
  return (
    <PipelineBoard
      title="Attorney Pipeline"
      items={scoped}
      emptyLabel="No attorney relationships tracked."
    />
  );
}
