"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeRefresh(
  tables: string[],
  onChange: () => void | Promise<void>,
  opts: {
    debounceMs?: number;
    throttleMs?: number;
    channelName?: string;
  } = {},
) {
  const debounce = opts.debounceMs ?? 400;
  const throttle = opts.throttleMs ?? 0;
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    if (!tables.length) return;
    const supabase = createClient();

    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastFiredAt = 0;
    let pending = false;

    const invoke = async () => {
      lastFiredAt = Date.now();
      pending = false;
      try {
        await handlerRef.current();
      } catch (err) {
        console.error("[useRealtimeRefresh] handler threw", err);
      }
    };

    const fire = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const since = Date.now() - lastFiredAt;
        if (throttle > 0 && since < throttle) {
          if (!pending) {
            pending = true;
            setTimeout(() => {
              pending = false;
              void invoke();
            }, throttle - since);
          }
          return;
        }
        void invoke();
      }, debounce);
    };

    const channelName =
      opts.channelName ?? `ms-rt-${tables.join("-")}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    for (const t of tables) {
      channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: t } as never,
        () => fire(),
      );
    }

    channel.subscribe(() => {});

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [tables.join(","), debounce, throttle]);
}
