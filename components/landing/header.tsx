"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { CredentialTicker } from "@/components/landing/credential-ticker";

const navLinks = [
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "Countries", href: "/countries" },
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
      {/* paddingTop: var(--sa-top) keeps header content below the notch/Dynamic Island.
          Requires viewport-fit=cover (set in app/layout.tsx). */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-[#0A0A0A]"
        style={{ paddingTop: "var(--sa-top)" }}
      >
        <div className={isScrolled ? "border-b border-white/[0.06]" : ""}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              <Link
                href="/"
                className="group flex-shrink-0 select-none flex items-center gap-3"
                aria-label="The Milano Seal home"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/milano-seal-feather-m-orb.png"
                  alt=""
                  aria-hidden="true"
                  width={64}
                  height={64}
                  style={{ display: "block", objectFit: "contain", flexShrink: 0, width: "clamp(48px, 5vw, 64px)", height: "clamp(48px, 5vw, 64px)" }}
                />
                <span className="flex flex-col leading-none">
                  <span className="font-serif text-[17px] md:text-[20px] font-semibold uppercase text-[#D3B35A] tracking-[0.22em] md:tracking-[0.28em] drop-shadow-[0_0_12px_rgba(198,165,90,0.18)]">
                    The Milano Seal
                  </span>
                  <span className="hidden sm:block mt-1.5 text-[7px] md:text-[8px] uppercase tracking-[0.32em] text-[#8B743C]">
                    Global Document Execution
                  </span>
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

              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#C6A55A]/60 text-[#C6A55A] text-sm font-medium rounded-lg transition-all duration-300 hover:border-[#C6A55A] hover:bg-[#C6A55A]/8"
                >
                  Login
                </Link>
                <Link
                  href="/intake"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6A55A] text-[#0A0A0A] text-sm font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
                >
                  <span>Begin Secure Intake</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        <CredentialTicker />
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 z-40 md:hidden bg-[#0A0A0A] border-b border-[#2A2A2A]"
            style={{ top: "calc(148px + var(--sa-top))" }}
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
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center px-5 py-3 mt-4 border border-[#C6A55A]/60 text-[#C6A55A] font-medium rounded-lg"
              >
                Login
              </Link>
              <Link
                href="/intake"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg"
              >
                <span>Begin Secure Intake</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
