"use client";

// Milano Seal cinematic motion system — isolated demo shell (NO map / no Global
// Intelligence Network). ALL values here are demo/illustrative only and must never
// be used on live routes. Self-contained preview for visual approval.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, BookLock, Scale, Briefcase, Building2, Stamp, Anchor, Plane } from "lucide-react";

import { MilanoMotionStyles, SectionLabel } from "./MilanoMotionStyles";
import { AtmosphericLayers } from "./AtmosphericLayers";
import { NetworkParticleCanvas } from "./NetworkParticleCanvas";
import { BootSequence } from "./BootSequence";
import { SovereignHeaderMotion } from "./SovereignHeaderMotion";
import { HolographicCore } from "./HolographicCore";
import { TrustStatusBarMotion } from "./TrustStatusBarMotion";
import { ExecutionPipelineMotion } from "./ExecutionPipelineMotion";
import { CustodyTimelineMotion } from "./CustodyTimelineMotion";
import { ModuleGridMotion } from "./ModuleGridMotion";
import { CourierTrackerMotion } from "./CourierTrackerMotion";
import { CompliancePanelMotion } from "./CompliancePanelMotion";
import { EngagementCTAMotion } from "./EngagementCTAMotion";
import { SovereignFooterMotion } from "./SovereignFooterMotion";

type ModuleItem = {
  id: string;
  codename: string;
  role: string;
  integrity: number;
  throughput: number;
  custody: number;
  icon: typeof ShieldCheck;
};

export default function MilanoSealMotionDemoNoMap() {
  const [bootProgress, setBootProgress] = useState(0);
  const [systemOnline, setSystemOnline] = useState(false);
  const [activeModules, setActiveModules] = useState<ModuleItem[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date(0));
  const [courierProgress, setCourierProgress] = useState(0);
  const [showCourier, setShowCourier] = useState(false);

  // Demo/illustrative modules only.
  const modules: ModuleItem[] = [
    { id: "MOD-001", codename: "SENTINEL", role: "Trust Engine Authority", integrity: 99.4, throughput: 98.2, custody: 1247, icon: ShieldCheck },
    { id: "MOD-002", codename: "ARCHIVE", role: "Execution Intelligence Core", integrity: 98.7, throughput: 96.7, custody: 2403, icon: BookLock },
    { id: "MOD-003", codename: "COMPASS", role: "Compliance Validation", integrity: 99.8, throughput: 99.1, custody: 1689, icon: Scale },
    { id: "MOD-004", codename: "LEDGER", role: "Wise Payment Rail", integrity: 99.2, throughput: 97.4, custody: 834, icon: Briefcase },
    { id: "MOD-005", codename: "CONSUL", role: "Consular Coordination", integrity: 98.9, throughput: 98.8, custody: 1572, icon: Building2 },
    { id: "MOD-006", codename: "APOSTILLE", role: "State Authentication", integrity: 99.5, throughput: 95.3, custody: 928, icon: Stamp },
    { id: "MOD-007", codename: "CUSTODY", role: "Chain Integrity Protocol", integrity: 99.7, throughput: 99.4, custody: 1856, icon: Anchor },
    { id: "MOD-008", codename: "COURIER", role: "Courier Logistics", integrity: 98.3, throughput: 94.6, custody: 1281, icon: Plane },
  ];

  const [matters, setMatters] = useState({
    intake: [
      { id: "m1", num: "2847", client: "S. Martinez", dest: "Italy", flag: "🇮🇹" },
      { id: "m2", num: "2848", client: "R. Silva", dest: "Spain", flag: "🇪🇸" },
    ],
    execution: [{ id: "m3", num: "2849", client: "M. Costa", dest: "Brazil", flag: "🇧🇷" }],
    apostille: [{ id: "m4", num: "2845", client: "A. Bertolli", dest: "Italy", flag: "🇮🇹" }],
  });

  const [custodyEvents, setCustodyEvents] = useState([
    { id: "c1", time: "14:23 UTC", type: "INTAKE_RECEIVED", desc: "Matter authenticated through Trust Engine", actor: "SENTINEL", verified: true },
    { id: "c2", time: "14:31 UTC", type: "COMPLIANCE_VERIFIED", desc: "Hague Convention validation complete", actor: "COMPASS", verified: true },
    { id: "c3", time: "14:47 UTC", type: "PAYMENT_CONFIRMED", desc: "Wise transfer reconciled — Reference MS-2847", actor: "LEDGER", verified: true },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBootProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setSystemOnline(true);
          return 100;
        }
        return p + 4;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!systemOnline) return;
    const timeouts = modules.map((module, index) =>
      setTimeout(() => setActiveModules((prev) => [...prev, module]), index * 180),
    );
    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemOnline]);

  useEffect(() => {
    if (!systemOnline) return;
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [systemOnline]);

  useEffect(() => {
    if (!systemOnline) return;
    const timers = [
      setTimeout(() => {
        setMatters((prev) => {
          if (prev.intake.length === 0) return prev;
          const [first, ...rest] = prev.intake;
          return { ...prev, intake: rest, execution: [...prev.execution, first] };
        });
      }, 6000),
      setTimeout(() => {
        setCustodyEvents((prev) => [
          ...prev,
          {
            id: `c-demo-2`,
            time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) + " UTC",
            type: "EXECUTION_COMPLETE",
            desc: "Documents executed with seal applied",
            actor: "SENTINEL",
            verified: true,
          },
        ]);
      }, 7500),
      setTimeout(() => setShowCourier(true), 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [systemOnline]);

  useEffect(() => {
    if (!showCourier) return;
    const interval = setInterval(() => {
      setCourierProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 1.2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [showCourier]);

  return (
    <div className="ms-motion min-h-screen bg-[#08080b] text-gray-100 relative overflow-x-hidden">
      <MilanoMotionStyles />
      <NetworkParticleCanvas active={systemOnline} />
      <AtmosphericLayers />

      <AnimatePresence>{!systemOnline && <BootSequence progress={bootProgress} />}</AnimatePresence>

      {systemOnline && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="relative z-10">
          <SovereignHeaderMotion currentTime={currentTime} activeModules={activeModules.length} totalModules={modules.length} />

          <main className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
            <div className="mb-8 rounded-sm border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#D4AF37]/80">
              Demo / Preview — illustrative values only · not live telemetry
            </div>

            <SectionLabel number="I" title="Command Core" subtitle="Illustrative Infrastructure Telemetry" />
            <HolographicCore />

            <div className="mt-12">
              <TrustStatusBarMotion />
            </div>

            <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SectionLabel number="II" title="Execution Pipeline" subtitle="Demo Matter Flow" />
                <ExecutionPipelineMotion matters={matters} />
              </div>
              <div>
                <SectionLabel number="III" title="Chain of Custody" subtitle="Audit Verification Stream" />
                <CustodyTimelineMotion events={custodyEvents} />
              </div>
            </div>

            <div className="mt-16">
              <SectionLabel number="IV" title="Operational Modules" subtitle="Demo System Components" />
              <ModuleGridMotion modules={activeModules} />
            </div>

            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <SectionLabel number="V" title="Courier Logistics" subtitle="Demo Courier Telemetry" />
                <CourierTrackerMotion progress={courierProgress} active={showCourier} />
              </div>
              <div>
                <SectionLabel number="VI" title="Compliance Intelligence" subtitle="Active Verification Protocols" />
                <CompliancePanelMotion />
              </div>
            </div>

            <div className="mt-16">
              <SectionLabel number="VII" title="Engagement" subtitle="Begin Cross-Border Execution" />
              <EngagementCTAMotion />
            </div>
          </main>

          <SovereignFooterMotion />
        </motion.div>
      )}
    </div>
  );
}
