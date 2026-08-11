import { SLA_HOURS, normalizeMatterStatus } from "@/lib/stateMachine";
import { sendAdminAlert } from "@/lib/whatsapp";

export interface MonitorableDeal {
  id?: string;
  deal_id?: string | null;
  status?: string | null;
  delivery_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  delivery_timestamp?: string | null;
}

export interface SLAVerdict {
  ok: boolean;
  hours_in_stage: number;
  threshold_hours: number | null;
  severity: "ok" | "low" | "medium" | "high";
  reason?: string;
}

const HOUR = 3_600_000;

export function checkSLA(deal: MonitorableDeal): SLAVerdict {
  const status = deal.status ?? "";
  const anchor = deal.updated_at ?? deal.created_at ?? new Date().toISOString();
  const hoursInStage = (Date.now() - new Date(anchor).getTime()) / HOUR;

  if (deal.delivery_status === "in_transit") {
    const days = hoursInStage / 24;
    if (days > 5) {
      return {
        ok: false,
        hours_in_stage: Math.round(hoursInStage),
        threshold_hours: 5 * 24,
        severity: "high",
        reason: `Shipment stuck in transit ${Math.floor(days)} days`,
      };
    }
    return {
      ok: true,
      hours_in_stage: Math.round(hoursInStage),
      threshold_hours: 5 * 24,
      severity: "ok",
    };
  }

  const normalizedStatus = normalizeMatterStatus(status);
  const threshold = normalizedStatus ? SLA_HOURS[normalizedStatus] : undefined;
  if (!threshold) {
    return {
      ok: true,
      hours_in_stage: Math.round(hoursInStage),
      threshold_hours: null,
      severity: "ok",
    };
  }

  const ratio = hoursInStage / threshold;
  if (ratio < 1) {
    return {
      ok: true,
      hours_in_stage: Math.round(hoursInStage),
      threshold_hours: threshold,
      severity: "ok",
    };
  }

  const severity: SLAVerdict["severity"] =
    ratio >= 2 ? "high" : ratio >= 1.5 ? "medium" : "low";
  return {
    ok: false,
    hours_in_stage: Math.round(hoursInStage),
    threshold_hours: threshold,
    severity,
    reason: `In stage "${status}" for ${Math.round(hoursInStage)}h (limit ${threshold}h)`,
  };
}

export async function checkAndAlert(
  deal: MonitorableDeal,
): Promise<SLAVerdict> {
  const verdict = checkSLA(deal);
  if (!verdict.ok && verdict.severity !== "low") {
    void sendAdminAlert(
      `SLA · ${verdict.severity.toUpperCase()} · ${
        deal.deal_id ?? deal.id ?? "(unknown)"
      } · ${verdict.reason ?? ""}`,
    ).catch(() => {});
  }
  return verdict;
}
