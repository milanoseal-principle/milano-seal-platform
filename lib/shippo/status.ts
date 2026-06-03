import type { MilanoCourierStatus } from "./types";

const STATUS_MAP: Record<string, MilanoCourierStatus> = {
  PRE_TRANSIT: "PRE_TRANSIT",
  TRANSIT: "TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  RETURNED: "RETURNED",
  FAILURE: "EXCEPTION",
  UNKNOWN: "UNKNOWN",
  // substatus codes
  information_received: "PRE_TRANSIT",
  delivery_attempted: "OUT_FOR_DELIVERY",
  available_for_pickup: "OUT_FOR_DELIVERY",
  delayed: "EXCEPTION",
  return_to_sender: "RETURNED",
};

export function mapShippoTrackingStatus(
  status: string,
  substatusCode?: string
): MilanoCourierStatus {
  const normalized = (status ?? "").toUpperCase();
  if (normalized in STATUS_MAP) return STATUS_MAP[normalized];
  if (substatusCode && substatusCode in STATUS_MAP) return STATUS_MAP[substatusCode];
  return "UNKNOWN";
}

type CustodyLedgerEventType =
  | "COURIER_UPDATE_RECEIVED"
  | "DOC_IN_TRANSIT"
  | "DOC_OUT_FOR_DELIVERY"
  | "DOC_DELIVERED"
  | "COURIER_RETURNED"
  | "COURIER_EXCEPTION";

export function toCustodyLedgerEvent(
  status: MilanoCourierStatus
): CustodyLedgerEventType {
  const map: Record<MilanoCourierStatus, CustodyLedgerEventType> = {
    PRE_TRANSIT: "COURIER_UPDATE_RECEIVED",
    TRANSIT: "DOC_IN_TRANSIT",
    OUT_FOR_DELIVERY: "DOC_OUT_FOR_DELIVERY",
    DELIVERED: "DOC_DELIVERED",
    RETURNED: "COURIER_RETURNED",
    EXCEPTION: "COURIER_EXCEPTION",
    LABEL_CREATED: "COURIER_UPDATE_RECEIVED",
    UNKNOWN: "COURIER_UPDATE_RECEIVED",
  };
  return map[status];
}
