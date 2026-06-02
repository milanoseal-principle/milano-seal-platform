// Milano Seal physical packaging SOP — operator-only reference.
// Documents inside vary by matter. Default protects folder and documents from bending.

export const MILANO_PACKAGING_SOP = {
  defaultProfile: "milano_folder_packet",
  defaultPhysicalPackaging: "Rigid stay-flat protective mailer",
  folderStandard: "Matte black 9x12 Milano Seal presentation folder",
  packageStack: [
    "Printed Milano Seal document slip or cover letter",
    "Apostille or notarized document packet",
    "Optional copy set (if applicable)",
    "Matte black Milano Seal presentation folder",
    "Rigid stay-flat protective mailer",
    "Carrier label",
    "Shippo tracking registered",
  ],
  prohibitedPackaging: [
    "thin poly mailer",
    "loose folder without rigid protection",
    "glossy folder",
    "unprotected envelope",
    "bending-prone packaging",
  ],
  operatorInstruction:
    "Place completed documents inside the Milano Seal folder when size permits. Place folder inside rigid stay-flat protective mailer before carrier release.",
  releaseNote:
    "All completed matters should be placed inside a matte black Milano Seal folder when document size permits. The folder must be placed inside a rigid stay-flat protective mailer before carrier release.",
} as const;

// Release packaging QA checklist — every item must be confirmed before release
export const PACKAGING_QA_CHECKLIST = [
  { id: "document_slip",         label: "Document slip or cover letter included" },
  { id: "documents_included",    label: "Apostille / notarized documents included" },
  { id: "copy_set",              label: "Copy set included (if applicable)" },
  { id: "folder_included",       label: "Milano Seal folder included (if size permits)" },
  { id: "rigid_mailer",         label: "Rigid stay-flat protective mailer selected" },
  { id: "carrier_label",         label: "Carrier label created" },
  { id: "tracking_registered",   label: "Tracking registered" },
  { id: "delivered_not_released",label: "Delivered Not Released queue reviewed" },
  { id: "certificate_ready",     label: "Release certificate ready (if required)" },
] as const;

export type PackagingQAItem = typeof PACKAGING_QA_CHECKLIST[number];
