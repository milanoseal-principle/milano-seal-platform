export interface ShippoAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
  email?: string;
  is_residential?: boolean;
}

export interface ShippoParcel {
  length: string;
  width: string;
  height: string;
  distance_unit: "in" | "cm";
  weight: string;
  mass_unit: "lb" | "kg" | "oz" | "g";
}

export interface ShippoShipmentPayload {
  address_from: ShippoAddress;
  address_to: ShippoAddress;
  parcels: ShippoParcel[];
  customs_declaration?: string;
  async?: boolean;
}

export interface ShippoRate {
  object_id: string;
  provider: string;
  provider_image_75?: string;
  servicelevel: {
    name: string;
    token: string;
    terms?: string;
  };
  estimated_days?: number;
  duration_terms?: string;
  arrives_by?: string | null;
  amount: string;
  currency: string;
  amount_local: string;
  currency_local: string;
}

export interface ShippoShipmentResponse {
  object_id: string;
  status: string;
  address_from: ShippoAddress;
  address_to: ShippoAddress;
  rates: ShippoRate[];
  messages?: { code: string; text: string }[];
}

export interface ShippoTransaction {
  object_id: string;
  status: string;
  tracking_number: string;
  tracking_url_provider?: string;
  label_url: string;
  eta?: string;
  messages?: { code: string; text: string }[];
}

export interface ShippoTrackingStatus {
  carrier: string;
  tracking_number: string;
  address_from?: Partial<ShippoAddress>;
  address_to?: Partial<ShippoAddress>;
  eta?: string | null;
  original_eta?: string | null;
  servicelevel?: { name: string; token: string };
  tracking_status?: {
    status: string;
    substatus?: { code: string; text: string; action_required?: boolean } | null;
    status_details: string;
    status_date: string;
    location?: { city?: string; state?: string; country?: string; zip?: string };
  };
  tracking_history?: ShippoTrackingEvent[];
}

export interface ShippoTrackingEvent {
  status: string;
  substatus?: { code: string; text: string; action_required?: boolean } | null;
  status_details: string;
  status_date: string;
  location?: { city?: string; state?: string; country?: string };
}

export interface ShippoCustomsItem {
  description: string;
  quantity: number;
  net_weight: string;
  mass_unit: string;
  value_amount: string;
  value_currency: string;
  origin_country: string;
  tariff_number?: string;
}

export interface ShippoCustomsDeclaration {
  contents_type:
    | "DOCUMENTS"
    | "GIFT"
    | "SAMPLE"
    | "MERCHANDISE"
    | "HUMANITARIAN_DONATION"
    | "RETURN_MERCHANDISE"
    | "OTHER";
  contents_explanation?: string;
  non_delivery_option: "ABANDON" | "RETURN";
  certify: boolean;
  certify_signer: string;
  items: string[]; // CustomsItem object IDs
  incoterm?: string;
  invoice?: string;
  license?: string;
  certificate?: string;
  notes?: string;
}

export type MilanoCourierStatus =
  | "LABEL_CREATED"
  | "PRE_TRANSIT"
  | "TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "EXCEPTION"
  | "RETURNED"
  | "UNKNOWN";

export interface SanitizedCourierStatus {
  carrier: string;
  tracking_number_display: string;
  tracking_url: string | null;
  courier_status: MilanoCourierStatus;
  label_created_at: string | null;
  last_update: string | null;
  events: SanitizedCourierEvent[];
}

export interface SanitizedCourierEvent {
  status: string;
  status_details: string;
  status_date: string;
  city?: string;
  country?: string;
}
