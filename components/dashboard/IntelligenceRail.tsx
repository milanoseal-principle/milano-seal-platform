"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Globe2, Send, Compass, FileCheck, Landmark, ShieldCheck } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const GLOBAL_ROUTES = [
  {
    origin: "Florida",
    destination: "Italy",
    label: "Apostille Validation Active",
    href: "/apostille/italy",
    icon: Globe2,
  },
  {
    origin: "Florida",
    destination: "Spain",
    label: "Hague Route Review",
    href: "/apostille/spain",
    icon: Send,
  },
  {
    origin: "Florida",
    destination: "UAE",
    label: "Consular Authentication Workflow",
    href: "/apostille/uae",
    icon: Compass,
  },
  {
    origin: "Florida",
    destination: "Brazil",
    label: "Document Authentication Sequence",
    href: "/apostille/brazil",
    icon: FileCheck,
  },
  {
    origin: "Florida",
    destination: "Mexico",
    label: "Cross-Border Notarial Routing",
    href: "/apostille/mexico",
    icon: Landmark,
  },
  {
    origin: "Florida",
    destination: "Florida",
    label: "Execution Origin / Notarial Commission",
    href: "/founder",
    icon: ShieldCheck,
  },
];

export function IntelligenceRail() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % GLOBAL_ROUTES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = GLOBAL_ROUTES[index];

  return (
    <div
      className="w-full border-b border-[#1A1A1A] bg-[#050505]/80 backdrop-blur-md py-2 px-4 select-none flex-shrink-0"
      style={{ backdropFilter: "blur(8px)" }}
    >
      {/* Desktop: all routes shown simultaneously as two-line objects */}
      <div className="hidden md:flex items-center justify-between gap-0">
        {/* Label */}
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase text-[#4A4A4A] flex-shrink-0 pr-6 border-r border-[#1A1A1A]">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="whitespace-nowrap">Global Document Intelligence</span>
        </div>

        {/* Route objects */}
        <div className="flex items-center flex-1 overflow-x-auto scrollbar-none">
          {GLOBAL_ROUTES.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.destination}
                href={route.href}
                prefetch={false}
                aria-label={
                  route.destination === "Florida"
                    ? "View Florida execution origin and notarial commission details"
                    : `View ${route.destination} document execution requirements`
                }
                className="group flex items-center gap-2.5 px-5 py-1 border-r border-[#1A1A1A] last:border-none transition-all duration-300 flex-shrink-0"
              >
                <div className="relative flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#3A3A3A] group-hover:text-[#C6A55A] transition-colors duration-300" />
                  <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-amber-600/60 rounded-full" />
                </div>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] tracking-[0.18em] uppercase text-[#6A6A6A] group-hover:text-[#C6A55A] transition-colors duration-300 whitespace-nowrap">
                    {route.origin} → {route.destination}
                  </span>
                  <span className="mt-0.5 text-[8.5px] tracking-[0.14em] uppercase text-[#3A3A3A] group-hover:text-[#8A8A8A] transition-colors duration-300 whitespace-nowrap">
                    {route.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile: one route at a time, two-line hierarchy, fades every 5s */}
      <div className="flex md:hidden items-center justify-between gap-3">
        {/* Label */}
        <div className="flex items-center gap-1.5 text-[#4A4A4A] flex-shrink-0">
          <motion.span
            className="h-1 w-1 rounded-full bg-emerald-500 flex-shrink-0"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[8px] font-mono tracking-widest uppercase">Global Intel</span>
        </div>

        {/* Rotating two-line route item */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`mob-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex-1 flex justify-end"
          >
            <Link
              href={current.href}
              prefetch={false}
              aria-label={
                current.destination === "Florida"
                  ? "View Florida execution origin and notarial commission details"
                  : `View ${current.destination} document execution requirements`
              }
              className="flex flex-col leading-tight items-end"
            >
              <span className="text-[10px] tracking-[0.18em] uppercase text-[#B0B0B0]">
                {current.origin} → {current.destination}
              </span>
              <span className="mt-0.5 text-[8px] tracking-[0.14em] uppercase text-[#4A4A4A]">
                {current.label}
              </span>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
