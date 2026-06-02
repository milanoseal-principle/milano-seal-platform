import type { ShippoParcel } from "./types";

export type ParcelProfile =
  | "flat_document_envelope"
  | "multi_document_packet"
  | "presentation_folder_packet"
  | "executive_packet";

export const PARCEL_PROFILES: Record<ParcelProfile, ShippoParcel> = {
  flat_document_envelope: {
    length: "12",
    width: "9",
    height: "1",
    distance_unit: "in",
    weight: "1",
    mass_unit: "lb",
  },
  multi_document_packet: {
    length: "12",
    width: "9",
    height: "2",
    distance_unit: "in",
    weight: "2",
    mass_unit: "lb",
  },
  presentation_folder_packet: {
    length: "13",
    width: "10",
    height: "1.5",
    distance_unit: "in",
    weight: "1.5",
    mass_unit: "lb",
  },
  executive_packet: {
    length: "14",
    width: "10",
    height: "2",
    distance_unit: "in",
    weight: "2.5",
    mass_unit: "lb",
  },
};

export function buildDocumentParcel(opts?: {
  documentCount?: number;
  envelopeType?: "flat" | "padded" | "box";
  profile?: ParcelProfile;
}): ShippoParcel {
  if (opts?.profile) {
    return PARCEL_PROFILES[opts.profile];
  }

  const count = opts?.documentCount ?? 1;

  // Increase weight slightly for large document sets
  let weight = "1";
  if (count > 20) weight = "2";
  else if (count > 10) weight = "1.5";

  return {
    length: "12",
    width: "9",
    height: "1",
    distance_unit: "in",
    weight,
    mass_unit: "lb",
  };
}
