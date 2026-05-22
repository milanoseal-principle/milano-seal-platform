"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { CredentialTicker } from "@/components/landing/credential-ticker";

function MilanoCrest({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="46" stroke="#C6A55A" strokeWidth="1.8" fill="none" />
      {/* Feather quill — right side of M */}
      <path
        d="M60 20 C76 24 80 44 74 60 C68 50 62 45 56 43 C68 39 68 27 60 20Z"
        fill="#C6A55A"
        opacity="0.88"
      />
      {/* Serif M — two mirrored V-paths */}
      <path d="M22,72 L22,28 L50,53" stroke="#C6A55A" strokeWidth="5.5" fill="none" strokeLinecap="butt" strokeLinejoin="miter" />
      <path d="M78,72 L78,28 L50,53" stroke="#C6A55A" strokeWidth="5.5" fill="none" strokeLinecap="butt" strokeLinejoin="miter" />
      {/* Serif crossbars */}
      <line x1="15" y1="28" x2="29" y2="28" stroke="#C6A55A" strokeWidth="3.5" />
      <line x1="15" y1="72" x2="29" y2="72" stroke="#C6A55A" strokeWidth="3.5" />
      <line x1="71" y1="28" x2="85" y2="28" stroke="#C6A55A" strokeWidth="3.5" />
      <line x1="71" y1="72" x2="85" y2="72" stroke="#C6A55A" strokeWidth="3.5" />
    </svg>
  );
}

const navLinks = [
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Countries", href: "/#countries" },
  { label: "Map", href: "/map" },
  { label: "About", href: "/about" },
  { label: "Founder", href: "/founder" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/*
        Unified header: ticker (row 1) + nav (row 2) in one fixed element.
        Total height: ~36px ticker + 80px nav = 116px.
        Hero section must clear pt-[116px] minimum.
      */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-[#0A0A0A]">
        {/* Row 1 — credential ticker, always visible */}
        <CredentialTicker />

        {/* Row 2 — navigation bar */}
        <div className={isScrolled ? "border-b border-white/[0.06]" : ""}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex-shrink-0 select-none flex items-center gap-3">
                <MilanoCrest size={38} />
                <span className="text-[13px] font-semibold uppercase text-[#C6A55A] tracking-[0.32em]">
                  The Milano Seal
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-[#B0B0B0] hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="hidden md:block">
                <Link
                  href="/intake"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6A55A] text-[#0A0A0A] text-sm font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
                >
                  <span>Begin Execution</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu — drops below unified header (116px) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[116px] z-40 md:hidden bg-[#0A0A0A] border-b border-[#2A2A2A]"
          >
            <nav className="flex flex-col p-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg text-[#B0B0B0] hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/intake"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 mt-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg"
              >
                <span>Begin Execution</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
