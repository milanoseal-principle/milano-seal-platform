import { OPERATOR_SPINE_MODULES } from "@/lib/operator-spine/operatorSpineRegistry";
import CinematicSpineBackground from "./CinematicSpineBackground";
import SpineActionCard from "./SpineActionCard";
import SpineHero from "./SpineHero";
import SpineStatusRail from "./SpineStatusRail";
import TodayExecutionModePanel from "./TodayExecutionModePanel";
import WeeklyExecutionPlannerPanel from "./WeeklyExecutionPlannerPanel";
import MatterActivityLedgerPanel from "./MatterActivityLedgerPanel";
import ExecutionRoutePlansPanel from "./ExecutionRoutePlansPanel";
import MilanoRevenueLedgerPanel from "./MilanoRevenueLedgerPanel";
import PrivateRelationshipIntelPanel from "./PrivateRelationshipIntelPanel";
import PartnerMemoryPanel from "./PartnerMemoryPanel";
import ExecutionHeatmapPanel from "./ExecutionHeatmapPanel";
import AIOperatorPlannerPanel from "./AIOperatorPlannerPanel";
import DailyCloseoutPanel from "./DailyCloseoutPanel";
import OperatorVoiceNotesPanel from "./OperatorVoiceNotesPanel";
import OperatorSpineBoundaryPanel from "./OperatorSpineBoundaryPanel";
import PackagingDeliveryChecklistPanel from "./PackagingDeliveryChecklistPanel";

const panels = [TodayExecutionModePanel, WeeklyExecutionPlannerPanel, MatterActivityLedgerPanel, ExecutionRoutePlansPanel, MilanoRevenueLedgerPanel, PrivateRelationshipIntelPanel, PartnerMemoryPanel, ExecutionHeatmapPanel, AIOperatorPlannerPanel, DailyCloseoutPanel, OperatorVoiceNotesPanel];
export default function OperatorSpineShell() { return <main className="relative min-h-screen overflow-x-hidden bg-black pb-[calc(2rem+env(safe-area-inset-bottom))] text-stone-100"><CinematicSpineBackground /><div className="relative mx-auto max-w-7xl px-4 py-8 md:px-8"><SpineHero /><div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]"><SpineStatusRail /><div className="grid gap-6">{OPERATOR_SPINE_MODULES.map((module, index) => { const Panel = panels[index]; return <section id={module.routeAnchor} key={module.id} className="scroll-mt-8"><SpineActionCard title={module.label} description={module.description} status={module.status} risk={module.risk} nextAction="Operator review required before any live action." sourceStatus={module.sourceStatus} />{Panel ? <Panel /> : null}</section>; })}<PackagingDeliveryChecklistPanel /><OperatorSpineBoundaryPanel /></div></div></div></main>; }
