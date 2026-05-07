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

export interface PortalDeal {
  id: string;
  client_name: string | null;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  destination_country: string | null;
  country: string | null;
  status: string | null;
  payment_status: string | null;
  amount: number | null;
  invoice_subtotal: number | null;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  tracking_number: string | null;
  carrier: string | null;
  label_url: string | null;
  delivery_status: string | null;
  delivery_eta: string | null;
  delivery_timestamp: string | null;
  signed_by: string | null;
  ship_to: Record<string, unknown> | null;
  evidence_url: string | null;
  evidence_path: string | null;
  evidence_generated_at: string | null;
  created_at: string | null;
}

export interface LedgerRow {
  id: string;
  event: string;
  actor_type: string;
  location: string | null;
  status: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface PortalState {
  deals: PortalDeal[];
  deal: PortalDeal | null;
  activeDealId: string | null;
  setActiveDealId: (id: string) => void;
  ledger: LedgerRow[];
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
  const [deals, setDeals] = useState<PortalDeal[]>([]);
  const [activeDealId, setActiveDealIdState] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
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
        deals?: PortalDeal[];
        deal?: PortalDeal | null;
        ledger?: LedgerRow[];
        message?: string;
      };
      const allDeals = body.deals ?? (body.deal ? [body.deal] : []);
      setDeals(allDeals);
      setLedger(body.ledger ?? []);
      setMessage(body.message ?? null);

      if (!activeDealIdRef.current && body.deal) {
        activeDealIdRef.current = body.deal.id;
        setActiveDealIdState(body.deal.id);
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
