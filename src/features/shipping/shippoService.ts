export const APPROVED_COURIERS = ["DHL Express", "FedEx International Priority", "UPS Worldwide Express"] as const;
export const SHIPMENT_DESCRIPTION = "Legal documents — no commercial value";
export const SHIPPO_WEBHOOK_EVENTS = ["LABEL_CREATED","SHIPPED","IN_TRANSIT","CUSTOMS_HOLD","OUT_FOR_DELIVERY","DELIVERED","DELIVERY_EXCEPTION","RETURNED"] as const;
export function mapShippoEventToMatterStatus(event: string) { return ({ LABEL_CREATED: "label_created", SHIPPED: "in_transit", IN_TRANSIT: "in_transit", CUSTOMS_HOLD: "customs_watch", OUT_FOR_DELIVERY: "out_for_delivery", DELIVERED: "delivered", DELIVERY_EXCEPTION: "customs_watch", RETURNED: "customs_watch" } as Record<string, string>)[event] ?? "in_transit"; }
