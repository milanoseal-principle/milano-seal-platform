export interface RevenueScenario {
  id: string;
  label: string;
  mattersPerMonth: number;
  averageGrossMatterValue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  note: string;
}

export const REVENUE_SCENARIOS: RevenueScenario[] = [
  { id: "conservative", label: "Conservative", mattersPerMonth: 10, averageGrossMatterValue: 650, monthlyRevenue: 6500, annualRevenue: 78000, note: "Planning scenario only; not actual booked revenue." },
  { id: "base", label: "Base", mattersPerMonth: 25, averageGrossMatterValue: 950, monthlyRevenue: 23750, annualRevenue: 285000, note: "Planning scenario only; not actual booked revenue." },
  { id: "growth", label: "Growth", mattersPerMonth: 50, averageGrossMatterValue: 1150, monthlyRevenue: 57500, annualRevenue: 690000, note: "Planning scenario only; not actual booked revenue." },
  { id: "scale_ron_alliance", label: "Scale with RON Alliance", mattersPerMonth: 100, averageGrossMatterValue: 1250, monthlyRevenue: 125000, annualRevenue: 1500000, note: "Planning scenario only; partner volume is not guaranteed." },
];

export function projectAnnualRevenue(mattersPerMonth: number, averageGrossMatterValue: number): number {
  return mattersPerMonth * averageGrossMatterValue * 12;
}
