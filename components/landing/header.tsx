"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { CredentialTicker } from "@/components/landing/credential-ticker";
import { MILANO_BRAND } from "@/app/theme/milanoBrand";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";

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

function navPath(href: string) {
  return href.split("#")[0] || "/";
}

function isActivePath(pathname: string, href: string) {
  const base = navPath(href);
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function Header() {
  const pathname = usePathname();
  const reducedMotion = useMilanoReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      mobileMenuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    }, reducedMotion ? 0 : 120);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen, reducedMotion]);

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-50 flex flex-col bg-[var(--ms-black)]"
        style={{ paddingTop: "var(--sa-top)" }}
      >
        <div className={isScrolled ? "border-b border-white/[0.06] shadow-[0_14px_40px_rgba(0,0,0,0.22)]" : ""}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex h-20 items-center justify-between gap-3">
              <Link
                href={isProfessionalAccess ? "/professional" : "/"}
                className="group flex min-w-0 flex-shrink select-none items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--ms-black)] sm:gap-3"
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
                <span className="flex min-w-0 flex-col leading-none">
                  <span className="truncate font-serif text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--ms-gold)] drop-shadow-[0_0_12px_rgba(198,166,91,0.18)] sm:text-[17px] sm:tracking-[0.22em] xl:text-[20px] xl:tracking-[0.28em]">
                    {MILANO_BRAND.name}
                  </span>
                  <span className="mt-1.5 hidden text-[8px] uppercase tracking-[0.32em] text-[var(--ms-gold)]/60 sm:block">
                    {isProfessionalAccess ? "Professional Execution Access" : "Global Document Execution"}
                  </span>
                </span>
              </Link>

              <nav className="hidden items-center gap-6 xl:flex 2xl:gap-8" aria-label={isProfessionalAccess ? "Professional navigation" : "Primary navigation"}>
                {navLinks.map((link) => {
                  const active = isActivePath(pathname ?? "/", link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative whitespace-nowrap rounded-md px-1 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)] ${active ? "text-white" : "text-[#B0B0B0] hover:text-white"}`}
                    >
                      {link.label}
                      {active ? <span className="absolute inset-x-1 -bottom-0.5 h-px bg-[var(--ms-gold)]/75" aria-hidden="true" /> : null}
                    </Link>
                  );
                })}
              </nav>

              <div className="hidden flex-shrink-0 items-center gap-3 xl:flex">
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--ms-gold)]/60 px-5 py-2.5 text-sm font-medium text-[var(--ms-gold)] transition-all duration-300 hover:border-[var(--ms-gold)] hover:bg-[var(--ms-gold)]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ms-black)] motion-reduce:transition-none"
                >
                  {isProfessionalAccess ? "Professional Login" : "Login"}
                </Link>
                <Link
                  href={intakeHref}
                  className="group inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--ms-gold)] px-5 py-2.5 text-sm font-medium text-[var(--ms-black)] transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ms-black)] motion-reduce:transition-none"
                >
                  <span>{intakeLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                </Link>
              </div>

              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)] xl:hidden"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="milano-mobile-navigation"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        <CredentialTicker />
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            id="milano-mobile-navigation"
            initial={reducedMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="fixed inset-x-0 z-40 max-h-[calc(100dvh-var(--header-total-height)-var(--sa-top))] overflow-y-auto overscroll-contain border-b border-[#2A2A2A] bg-[var(--ms-black)] shadow-[0_28px_80px_rgba(0,0,0,0.5)] xl:hidden"
            style={{ top: "calc(var(--header-total-height) + var(--sa-top))" }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <nav className="flex flex-col space-y-2 p-6 pb-[calc(1.5rem+var(--sa-bottom))]" aria-label={isProfessionalAccess ? "Professional mobile navigation" : "Mobile navigation"}>
              {navLinks.map((link) => {
                const active = isActivePath(pathname ?? "/", link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex min-h-12 items-center rounded-lg px-3 text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)] ${active ? "bg-[var(--ms-gold)]/[0.08] text-white" : "text-[#B0B0B0] hover:bg-white/[0.03] hover:text-white"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--ms-gold)]/60 px-5 py-3 font-medium text-[var(--ms-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]"
              >
                {isProfessionalAccess ? "Professional Login" : "Login"}
              </Link>
              <Link
                href={intakeHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-5 py-3 font-medium text-[var(--ms-black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>{intakeLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
