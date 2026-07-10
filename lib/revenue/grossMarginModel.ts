export interface GrossMarginBand {
  lane: string;
  low: number;
  high: number;
  note: string;
}

export const GROSS_MARGIN_BANDS: GrossMarginBand[] = [
  { lane: "Direct founder/operator matters", low: 70, high: 90, note: "Internal planning range; actual margin depends on matter scope and third-party costs." },
  { lane: "Partner-executed RON matters", low: 45, high: 75, note: "Internal planning range; partner payout and matter scope vary." },
  { lane: "Apostille/courier/translation coordination", low: 25, high: 60, note: "Internal planning range; third-party fees and courier costs vary." },
  { lane: "Blended target", low: 55, high: 75, note: "Internal operating target, not a promise or forecast guarantee." },
];
