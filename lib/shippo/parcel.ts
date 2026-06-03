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

// Milano Seal canonical package templates
export interface MilanoPackageTemplate {
  id: string;
  name: string;
  packageType: string;
  parcel: ShippoParcel;
  default: boolean;
  useWhen: string;
}

export const MILANO_PACKAGE_TEMPLATES: Record<string, MilanoPackageTemplate> = {
  document_packet: {
    id: "milano_document_packet",
    name: "Milano Seal Document Packet",
    packageType: "box_or_tube",
    parcel: { length: "12", width: "9", height: "1", distance_unit: "in", weight: "1", mass_unit: "lb" },
    default: false,
    useWhen: "Small document packet without branded folder",
  },
  folder_packet: {
    id: "milano_folder_packet",
    name: "Milano Seal Folder Packet",
    packageType: "box_or_tube",
    // Matte black 9x12 Milano Seal presentation folder inside rigid stay-flat mailer
    parcel: { length: "13", width: "10", height: "1", distance_unit: "in", weight: "1", mass_unit: "lb" },
    default: true,
    useWhen: "Standard matte black Milano Seal folder inside rigid stay-flat mailer",
  },
  executive_folder_packet: {
    id: "milano_executive_folder_packet",
    name: "Milano Seal Executive Folder Packet",
    packageType: "box_or_tube",
    parcel: { length: "13", width: "10", height: "2", distance_unit: "in", weight: "2", mass_unit: "lb" },
    default: false,
    useWhen: "Executive, multi-document, presentation folder, or thicker evidence packet",
  },
};

export function getDefaultPackageTemplate(): MilanoPackageTemplate {
  return MILANO_PACKAGE_TEMPLATES.folder_packet;
}

export function selectPackageTemplate(opts: {
  lane?: string;
  documentCount?: number;
  operatorOverride?: string;
}): MilanoPackageTemplate {
  if (opts.operatorOverride && MILANO_PACKAGE_TEMPLATES[opts.operatorOverride]) {
    return MILANO_PACKAGE_TEMPLATES[opts.operatorOverride];
  }
  // Executive lane or multi-document → executive folder packet
  if (opts.lane === "executive" || (opts.documentCount ?? 1) > 3) {
    return MILANO_PACKAGE_TEMPLATES.executive_folder_packet;
  }
  return MILANO_PACKAGE_TEMPLATES.folder_packet;
}

export function buildDocumentParcel(opts?: {
  documentCount?: number;
  envelopeType?: "flat" | "padded" | "box";
  profile?: ParcelProfile;
  templateId?: string;
}): ShippoParcel {
  if (opts?.templateId && MILANO_PACKAGE_TEMPLATES[opts.templateId]) {
    return MILANO_PACKAGE_TEMPLATES[opts.templateId].parcel;
  }
  if (opts?.profile) {
    return PARCEL_PROFILES[opts.profile];
  }

  const count = opts?.documentCount ?? 1;

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

