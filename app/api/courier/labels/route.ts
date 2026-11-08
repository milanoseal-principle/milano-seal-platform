import { NextResponse } from 'next/server';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
export const dynamic='force-dynamic';
// Retired unclaimed purchase path. Use persisted shipment legs with atomic claims,
// current payment/release checks, immutable rate snapshots and explicit operator evidence.
export async function POST() {
 await requireDashboardAccess();
 return NextResponse.json({error:'GOVERNED_SHIPMENT_LEG_REQUIRED',owner:'MILANO',next_action:'Open the Matter Logistics panel, select the governed shipment leg and use Purchase label.',route:'/dashboard/matters',payment_gate_bypass_allowed:false},{status:409,headers:{'Cache-Control':'private, no-store'}});
}
