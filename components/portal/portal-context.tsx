"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

// Safe portal fields — mirrors PORTAL_SAFE_FIELDS from app/api/portal/me/route.ts
export interface PortalClientMatter {
  id: string;              // normalized: matter_id ?? id
  matter_id: string;
  display_id: string;
  client_name: string | null;
  document_type: string | null;
  destination_country: string | null;
  assigned_lane: string | null;
  matter_status: string | null;       // raw internal status (for logic/state machine)
  client_facing_status: string | null; // human-readable status copy
  payment_status: string | null;
  payment_amount_due: number | null;
  amount_due: number | null;
  payment_confirmed: boolean;
  paid_at: string | null;
  currency: string | null;
  invoice_status: string | null;
  wise_reference: string | null;
  wise_payment_url: string | null;
  is_platform_fee_only: boolean;
  courier_tracking_id: string | null;
  courier_carrier: string | null;
  delivery_status: string | null;
  delivery_eta: string | null;
  delivery_timestamp: string | null;
  is_paid_and_released: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// @deprecated — kept for shell compat during transition
export type PortalDeal = PortalClientMatter;

export interface LedgerRow {
  id: string;
  event: string;
  actor_type: string;
  location: string | null;
  status: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

type RawMatter = Record<string, unknown>;

function normalizeMatter(raw: RawMatter): PortalClientMatter {
  const matterId = (raw.matter_id ?? raw.id ?? "") as string;
  return {
    id: matterId,
    matter_id: matterId,
    display_id: (raw.display_id ?? matterId) as string,
    client_name: (raw.client_name as string | null) ?? null,
    document_type: (raw.document_type as string | null) ?? null,
    destination_country: (raw.destination_country as string | null) ?? null,
    assigned_lane: (raw.assigned_lane as string | null) ?? null,
    matter_status: (raw.matter_status as string | null) ?? (raw.status as string | null) ?? null,
    client_facing_status: (raw.client_facing_status as string | null) ?? null,
    payment_status: (raw.payment_status as string | null) ?? null,
    payment_amount_due: (raw.payment_amount_due as number | null) ?? null,
    amount_due: (raw.amount_due as number | null) ?? (raw.payment_amount_due as number | null) ?? null,
    payment_confirmed: (raw.payment_confirmed as boolean) ?? false,
    paid_at: (raw.paid_at as string | null) ?? null,
    currency: (raw.currency as string | null) ?? "USD",
    invoice_status: (raw.invoice_status as string | null) ?? null,
    wise_reference: (raw.wise_reference as string | null) ?? null,
    wise_payment_url: (raw.wise_payment_url as string | null) ?? null,
    is_platform_fee_only: (raw.is_platform_fee_only as boolean) ?? false,
    courier_tracking_id: (raw.courier_tracking_id as string | null) ?? (raw.tracking_number as string | null) ?? null,
    courier_carrier: (raw.courier_carrier as string | null) ?? (raw.carrier as string | null) ?? null,
    delivery_status: (raw.delivery_status as string | null) ?? null,
    delivery_eta: (raw.delivery_eta as string | null) ?? null,
    delivery_timestamp: (raw.delivery_timestamp as string | null) ?? null,
    is_paid_and_released: (raw.is_paid_and_released as boolean) ?? false,
    created_at: (raw.created_at as string | null) ?? null,
    updated_at: (raw.updated_at as string | null) ?? null,
  };
}

interface PortalState {
  deals: PortalClientMatter[];
  deal: PortalClientMatter | null;
  activeDealId: string | null;
  setActiveDealId: (id: string) => void;
  ledger: LedgerRow[];
  timeline: Array<{ event_id: string; event_label: string; public_description: string; timestamp_recorded: string }>;
  isLoading: boolean;
  error: string | null;
  message: string | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PortalState | null>(null);

export function usePortal(): PortalState {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePortal must be used inside <PortalProvider>");
  return v;
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<PortalClientMatter[]>([]);
  const [activeDealId, setActiveDealIdState] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [timeline, setTimeline] = useState<PortalState["timeline"]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const activeDealIdRef = useRef<string | null>(null);

  const refresh = useCallback(async (overrideDealId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const id = overrideDealId ?? activeDealIdRef.current;
      const url = id ? `/api/portal/me?deal_id=${id}` : "/api/portal/me";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        matters?: RawMatter[];
        deals?: RawMatter[];         // legacy fallback
        deal?: RawMatter | null;
        ledger?: LedgerRow[];
        timeline?: PortalState["timeline"];
        message?: string;
      };

      // Normalize: prefer matters[], fall back to deals[], last resort single deal
      const rawList: RawMatter[] =
        body.matters ??
        body.deals ??
        (body.deal ? [body.deal] : []);

      const normalized = rawList.map(normalizeMatter);
      setDeals(normalized);
      setLedger(body.ledger ?? []);
      setTimeline(body.timeline ?? []);
      setMessage(body.message ?? null);

      if (!activeDealIdRef.current && normalized.length > 0) {
        activeDealIdRef.current = normalized[0].id;
        setActiveDealIdState(normalized[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setActiveDealId = useCallback(
    (id: string) => {
      activeDealIdRef.current = id;
      setActiveDealIdState(id);
      void refresh(id);
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeRefresh(["deals", "custody_ledger", "messages"], refresh, {
    throttleMs: 3_000,
  });

  const deal = deals.find((d) => d.id === activeDealId) ?? deals[0] ?? null;

  return (
    <Ctx.Provider
      value={{
        deals,
        deal,
        activeDealId,
        setActiveDealId,
        ledger,
        timeline,
        isLoading,
        error,
        message,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
