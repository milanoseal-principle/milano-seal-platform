"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseApiResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useApi<T = unknown>(
  url: string | null,
  init?: RequestInit
): UseApiResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<Error | null>(null);
  const seqRef = useRef(0);

  const fetcher = useCallback(async () => {
    if (!url) {
      setIsLoading(false);
      return;
    }
    const seq = ++seqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        cache: "no-store",
        ...init,
      });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const body = (await res.json()) as T;
      if (seq === seqRef.current) {
        setData(body);
      }
    } catch (err) {
      if (seq === seqRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (seq === seqRef.current) setIsLoading(false);
    }
  }, [url, init]);

  useEffect(() => {
    void fetcher();
  }, [url]);

  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    refetch: fetcher,
  };
}
