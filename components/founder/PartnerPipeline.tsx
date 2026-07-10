"use client";

import type { PipelineItem } from "@/lib/founder-os/types";
import { PipelineBoard } from "./PipelineBoard";

export function PartnerPipeline({ items = [] }: { items?: PipelineItem[] }) {
  const scoped = items.filter((i) => i.channel === "partner");
  return (
    <PipelineBoard
      title="Partner Pipeline"
      items={scoped}
      emptyLabel="No partner relationships tracked."
    />
  );
}
