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

export interface PortalClientMatter {
  id: string;
  matter_id: string;
  display_id: string;
  client_name: string | null;
  document_type: string | null;
  destination_country: string | null;
  assigned_lane: string | null;
  matter_status: string | null;
  client_facing_status: string | null;
  payment_status: string | null;
  payment_settlement_status: string | null;
  payment_observed_at: string | null;
  payment_disposition?: string | null;
  comp_authorized?: boolean | null;
  payment_amount_due: number | null;
  amount_due: number | null;
  amount_paid: number | null;
  payment_confirmed: boolean;
  paid_at: string | null;
  currency: string | null;
  invoice_status: string | null;
  wise_reference: string | null;
  wise_payment_url: string | null;
  original_total: number | null;
  discount_code: string | null;
  discount_amount: number;
  discount_value: number | null;
  final_total: number | null;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  courtesy_applied: boolean;
  courtesy_label: string | null;
  courier_tracking_id: string | null;
  courier_carrier: string | null;
  delivery_status: string | null;
  delivery_eta: string | null;
  delivery_timestamp: string | null;
  is_paid_and_released: boolean;
  is_platform_fee_only: boolean;
  created_at: string | null;
  updated_at: string | null;
  legacy_client_credit?: {
    credit_name: string;
    discount_percent: number;
    applies_to: string;
    client_safe_note: string;
    status: string;
  } | null;
}

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

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMatter(raw: RawMatter): PortalClientMatter {
  const matterId = (raw.matter_id ?? raw.id ?? "") as string;
  return {
    id: matterId,
    matter_id: matterId,
    display_id: (raw.display_id ?? raw.deal_id ?? matterId) as string,
    client_name: (raw.client_name as string | null) ?? null,
    document_type: (raw.document_type as string | null) ?? null,
    destination_country: (raw.destination_country as string | null) ?? null,
    assigned_lane: ((raw.assigned_lane ?? raw.lane) as string | null) ?? null,
    matter_status:
      (raw.matter_status as string | null) ??
      (raw.status as string | null) ??
      null,
    client_facing_status:
      (raw.client_facing_status as string | null) ?? null,
    payment_status: (raw.payment_status as string | null) ?? null,
    payment_settlement_status: (raw.payment_settlement_status as string | null) ?? null,
    payment_observed_at: (raw.payment_observed_at as string | null) ?? null,
    payment_disposition:
      (raw.payment_disposition as string | null) ?? null,
    comp_authorized: (raw.comp_authorized as boolean | null) ?? false,
    payment_amount_due: numberOrNull(raw.payment_amount_due),
    amount_due:
      numberOrNull(raw.amount_due) ?? numberOrNull(raw.payment_amount_due),
    amount_paid:
      numberOrNull(raw.amount_paid) ?? numberOrNull(raw.payment_amount_received),
    payment_confirmed: (raw.payment_confirmed as boolean) ?? false,
    paid_at: (raw.paid_at as string | null) ?? null,
    currency: (raw.currency as string | null) ?? "USD",
    invoice_status: (raw.invoice_status as string | null) ?? null,
    wise_reference:
      ((raw.wise_reference ?? raw.payment_reference) as string | null) ?? null,
    wise_payment_url:
      ((raw.wise_payment_url ?? raw.payment_link) as string | null) ?? null,
    original_total:
      numberOrNull(raw.original_total) ??
      numberOrNull(raw.amount_before_adjustment) ??
      numberOrNull(raw.total_price),
    discount_code: (raw.discount_code as string | null) ?? null,
    discount_amount: numberOrNull(raw.discount_amount) ?? 0,
    discount_value: numberOrNull(raw.discount_value),
    final_total: numberOrNull(raw.final_total) ?? numberOrNull(raw.total_price),
    invoice_retainer: numberOrNull(raw.invoice_retainer),
    invoice_balance: numberOrNull(raw.invoice_balance),
    courtesy_applied:
      (raw.courtesy_applied as boolean) ?? Number(raw.discount_amount ?? 0) > 0,
    courtesy_label: (raw.courtesy_label as string | null) ?? null,
    courier_tracking_id:
      (raw.courier_tracking_id as string | null) ??
      (raw.tracking_number as string | null) ??
      null,
    courier_carrier:
      (raw.courier_carrier as string | null) ??
      (raw.carrier as string | null) ??
      null,
    delivery_status: (raw.delivery_status as string | null) ?? null,
    delivery_eta: (raw.delivery_eta as string | null) ?? null,
    delivery_timestamp:
      (raw.delivery_timestamp as string | null) ?? null,
    is_paid_and_released: (raw.is_paid_and_released as boolean) ?? false,
    is_platform_fee_only: (raw.is_platform_fee_only as boolean) ?? false,
    created_at: (raw.created_at as string | null) ?? null,
    updated_at: (raw.updated_at as string | null) ?? null,
    legacy_client_credit:
      (raw.legacy_client_credit as PortalClientMatter["legacy_client_credit"]) ??
      null,
  };
}

interface PortalState {
  deals: PortalClientMatter[];
  deal: PortalClientMatter | null;
  activeDealId: string | null;
  setActiveDealId: (id: string) => void;
  ledger: LedgerRow[];
  timeline: Array<{
    event_id: string;
    event_label: string;
    public_description: string;
    timestamp_recorded: string;
  }>;
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
        deals?: RawMatter[];
        deal?: RawMatter | null;
        ledger?: LedgerRow[];
        timeline?: PortalState["timeline"];
        message?: string;
      };

      const rawList: RawMatter[] =
        body.matters ?? body.deals ?? (body.deal ? [body.deal] : []);

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
