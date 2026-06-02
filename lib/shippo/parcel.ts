import type { ShippoParcel } from "./types";

export function buildDocumentParcel(opts?: {
  documentCount?: number;
  envelopeType?: "flat" | "padded" | "box";
}): ShippoParcel {
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
