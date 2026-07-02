import type { GlobalAcceptanceResult } from "@/lib/milano-seal/global-acceptance/global-acceptance-types";
import { getAllianceMemberSafeStatus } from "@/lib/milano-seal/global-acceptance/alliance-member-rules";
export function AllianceMemberCompliancePanel({ result }: { result: GlobalAcceptanceResult }) { const status = getAllianceMemberSafeStatus(result); return <section className="rounded-2xl border border-amber-300/20 p-4"><h3>Alliance Safe Status</h3><p>{status.route}</p><p>{status.nextStep}</p></section>; }
