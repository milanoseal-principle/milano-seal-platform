"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    // Reveal header 200ms after mount — after ritual overlay fades out
    const t = setTimeout(() => setMounted(true), 200);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(t);
    };
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ms-header-reveal${mounted ? " is-visible" : ""} ${
          isScrolled
            ? "bg-[#0A0A0A]/95 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              {/* Seal emblem — cropped to mark only */}
              <div
                className="relative overflow-hidden flex-shrink-0"
                style={{ width: 42, height: 42 }}
              >
                <Image
                  src="/milano-seal-gold-transparent-512.png"
                  alt="The Milano Seal"
                  fill
                  style={{ objectFit: "cover", objectPosition: "left center" }}
                  priority
                />
              </div>
              {/* Wordmark — shown sm and up */}
              <div className="hidden sm:flex flex-col leading-none select-none">
                <span
                  className="text-[11px] font-semibold uppercase text-[#C6A55A]"
                  style={{ letterSpacing: "0.26em" }}
                >
                  The Milano Seal
                </span>
                <span
                  className="text-[8px] font-normal uppercase mt-[3px]"
                  style={{ letterSpacing: "0.14em", color: "#6A6A5E" }}
                >
                  International · LLC
                </span>
              </div>
            </Link>

            {/* Desktop navigation */}
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

            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Link
                href="/intake"
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6A55A] text-[#0A0A0A] text-sm font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
              >
                <span>Begin Execution</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile menu button */}
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
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-40 md:hidden bg-[#0A0A0A] border-b border-[#2A2A2A]"
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
