"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { CredentialTicker } from "@/components/landing/credential-ticker";
import { MILANO_BRAND } from "@/app/theme/milanoBrand";

const publicNavLinks = [
  { label: "Services", href: "/#services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Process", href: "/process" },
  { label: "Global Intelligence", href: "/global-document-intelligence" },
  { label: "Professional", href: "/professional" },
  { label: "About", href: "/about" },
  { label: "Secure Portal", href: "/secure-portal" },
];

const professionalNavLinks = [
  { label: "Professional Home", href: "/professional" },
  { label: "Country Route", href: "/professional#professional-journey" },
  { label: "Execution Scope", href: "/professional#professional-scope" },
  { label: "Counsel Boundary", href: "/professional#professional-boundary" },
  { label: "Secure Portal", href: "/secure-portal" },
];

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isProfessionalAccess = pathname?.startsWith("/professional") ?? false;
  const navLinks = isProfessionalAccess ? professionalNavLinks : publicNavLinks;
  const intakeHref = isProfessionalAccess
    ? "/intake?lane=professional&source=professional-navigation"
    : "/intake";
  const intakeLabel = isProfessionalAccess ? "Submit Client Matter" : "Begin Secure Intake";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-[var(--ms-black)]"
        style={{ paddingTop: "var(--sa-top)" }}
      >
        <div className={isScrolled ? "border-b border-white/[0.06]" : ""}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-20 gap-3">
              <Link
                href={isProfessionalAccess ? "/professional" : "/"}
                className="group min-w-0 flex-shrink select-none flex items-center gap-2.5 sm:gap-3"
                aria-label={`${MILANO_BRAND.name} ${isProfessionalAccess ? "professional access" : "home"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/milano-seal-orb-v2.png"
                  alt=""
                  aria-hidden="true"
                  width={64}
                  height={64}
                  className="ms-logo-shimmer"
                  style={{
                    display: "block",
                    objectFit: "contain",
                    flexShrink: 0,
                    width: "clamp(48px, 6vw, 72px)",
                    height: "clamp(48px, 6vw, 72px)",
                  }}
                />
                <span className="min-w-0 flex flex-col leading-none">
                  <span className="truncate font-serif text-[13px] sm:text-[17px] xl:text-[20px] font-semibold uppercase text-[var(--ms-gold)] tracking-[0.14em] sm:tracking-[0.22em] xl:tracking-[0.28em] drop-shadow-[0_0_12px_rgba(198,166,91,0.18)]">
                    {MILANO_BRAND.name}
                  </span>
                  <span className="hidden sm:block mt-1.5 text-[8px] uppercase tracking-[0.32em] text-[var(--ms-gold)]/60">
                    {isProfessionalAccess ? "Professional Execution Access" : "Global Document Execution"}
                  </span>
                </span>
              </Link>

              <nav className="hidden xl:flex items-center gap-6 2xl:gap-8" aria-label={isProfessionalAccess ? "Professional navigation" : "Primary navigation"}>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-[#B0B0B0] hover:text-white transition-colors duration-200 whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="hidden xl:flex items-center gap-3 flex-shrink-0">
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 border border-[var(--ms-gold)]/60 text-[var(--ms-gold)] text-sm font-medium rounded-lg transition-all duration-300 hover:border-[var(--ms-gold)] hover:bg-[var(--ms-gold)]/8"
                >
                  {isProfessionalAccess ? "Professional Login" : "Login"}
                </Link>
                <Link
                  href={intakeHref}
                  className="group inline-flex min-h-11 items-center gap-2 px-5 py-2.5 bg-[var(--ms-gold)] text-[var(--ms-black)] text-sm font-medium rounded-lg transition-all duration-300 hover:brightness-110"
                >
                  <span>{intakeLabel}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                className="xl:hidden flex-shrink-0 min-h-11 min-w-11 p-2 text-white"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="milano-mobile-navigation"
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
            id="milano-mobile-navigation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 z-40 xl:hidden bg-[var(--ms-black)] border-b border-[#2A2A2A] max-h-[calc(100dvh-var(--header-total-height)-var(--sa-top))] overflow-y-auto"
            style={{ top: "calc(var(--header-total-height) + var(--sa-top))" }}
          >
            <nav className="flex flex-col p-6 space-y-2" aria-label={isProfessionalAccess ? "Professional mobile navigation" : "Mobile navigation"}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="min-h-11 flex items-center text-lg text-[#B0B0B0] hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-12 items-center justify-center px-5 py-3 mt-4 border border-[var(--ms-gold)]/60 text-[var(--ms-gold)] font-medium rounded-lg"
              >
                {isProfessionalAccess ? "Professional Login" : "Login"}
              </Link>
              <Link
                href={intakeHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 bg-[var(--ms-gold)] text-[var(--ms-black)] font-medium rounded-lg"
              >
                <span>{intakeLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
