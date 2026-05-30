"use client";

import { useState, useEffect, useCallback } from "react";

export interface PortalMatter {
  id: string;
  display_id?: string;
  matter_id?: string;
  client_name?: string | null;
  document_type?: string | null;
  destination_country?: string | null;
  assigned_lane?: string | null;
  matter_status?: string | null;
  client_facing_status?: string | null;
  payment_status?: string | null;
  payment_amount_due?: number | null;
  courier_tracking_id?: string | null;
  courier_carrier?: string | null;
  delivery_status?: string | null;
  delivery_eta?: string | null;
  delivery_timestamp?: string | null;
  is_paid_and_released?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PortalTimelineEvent {
  event_id: string;
  event_label: string;
  public_description: string;
  timestamp_recorded: string;
}

export interface PortalLedgerEntry {
  id?: string;
  label?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface PortalData {
  matters: PortalMatter[];
  deal: PortalMatter | null;
  ledger: PortalLedgerEntry[];
  timeline: PortalTimelineEvent[];
  coordinator: { organization: string; contact: string } | null;
  message?: string;
}

export function usePortalData(dealId?: string | null) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/portal/me", window.location.origin);
      if (dealId) url.searchParams.set("deal_id", dealId);

      const res = await fetch(url.toString());
      if (res.status === 401) throw new Error("session_expired");
      if (!res.ok) throw new Error("retrieval_failed");

      const payload = await res.json();
      if (!payload.success && !payload.matters) throw new Error(payload.error ?? "unknown_error");

      setData({
        matters: payload.matters ?? [],
        deal: payload.deal ?? null,
        ledger: payload.ledger ?? [],
        timeline: payload.timeline ?? [],
        coordinator: payload.coordinator ?? null,
        message: payload.message,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown_error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refresh: fetch_ };
}
