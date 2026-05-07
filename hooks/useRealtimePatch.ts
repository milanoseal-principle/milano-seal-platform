"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

export type PatchHandler<T = Record<string, unknown>> = (
  event: RealtimeEvent,
  newRow: T | null,
  oldRow: T | null,
  table: string,
) => void | Promise<void>;

interface PostgresChangePayload {
  eventType?: string;
  new?: Record<string, unknown> | null;
  old?: Record<string, unknown> | null;
  table?: string;
}

export function useRealtimePatch<T = Record<string, unknown>>(
  tables: string[],
  onPatch: PatchHandler<T>,
  opts: { channelName?: string } = {},
) {
  const handlerRef = useRef(onPatch);
  handlerRef.current = onPatch;

  useEffect(() => {
    if (!tables.length) return;
    const supabase = createClient();
    const channelName =
      opts.channelName ?? `ms-patch-${tables.join("-")}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    for (const t of tables) {
      channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: t } as never,
        (raw: unknown) => {
          const p = raw as PostgresChangePayload;
          const ev = (p.eventType ?? "UPDATE").toUpperCase() as RealtimeEvent;
          const newRow = (p.new ?? null) as T | null;
          const oldRow = (p.old ?? null) as T | null;
          try {
            void handlerRef.current(ev, newRow, oldRow, p.table ?? t);
          } catch (err) {
            console.error("[useRealtimePatch] handler threw", err);
          }
        },
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tables.join(",")]);
}
