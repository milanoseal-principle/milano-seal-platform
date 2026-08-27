"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  BookOpenCheck,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Command,
  Compass,
  FilePlus2,
  FileStack,
  FolderOpen,
  Gift,
  GitFork,
  Handshake,
  HeadphonesIcon,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageCircle,
  PackageCheck,
  Percent,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  UploadCloud,
  User,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

export type MilanoOSMode = "operator" | "client" | "va" | "alliance";

export type MilanoOSIconKey =
  | "activity"
  | "dollar"
  | "chart"
  | "book"
  | "boxes"
  | "briefcase"
  | "building"
  | "calendar"
  | "check"
  | "clipboard"
  | "command"
  | "compass"
  | "filePlus"
  | "files"
  | "folder"
  | "gift"
  | "gitFork"
  | "handshake"
  | "headphones"
  | "layout"
  | "list"
  | "message"
  | "package"
  | "percent"
  | "receipt"
  | "settings"
  | "shield"
  | "truck"
  | "upload"
  | "user"
  | "wallet"
  | "wrench";

export interface MilanoOSNavItem {
  href: string;
  label: string;
  icon: MilanoOSIconKey;
  group?: string;
  hint?: string;
}

export interface MilanoOSStatusItem {
  label: string;
  value?: string;
  tone?: "gold" | "green" | "red" | "neutral";
}

export interface MilanoOSIdentity {
  name: string;
  meta?: string;
}

interface MilanoOSShellProps {
  children: ReactNode;
  mode: MilanoOSMode;
  nav: MilanoOSNavItem[];
  eyebrow: string;
  title: string;
  subtitle: string;
  brandSubtitle: string;
  topStrip?: ReactNode;
  sidebarContext?: ReactNode;
  statusItems?: MilanoOSStatusItem[];
  identity?: MilanoOSIdentity;
  primaryAction?: { href: string; label: string };
  footerNote?: string;
  signOut?: boolean;
  maxWidth?: number;
  contentClassName?: string;
}

const ICONS: Record<MilanoOSIconKey, LucideIcon> = {
  activity: Activity,
  dollar: CircleDollarSign,
  chart: BarChart3,
  book: BookOpenCheck,
  boxes: Boxes,
  briefcase: BriefcaseBusiness,
  building: Building2,
  calendar: CalendarClock,
  check: CheckCircle2,
  clipboard: ClipboardCheck,
  command: Command,
  compass: Compass,
  filePlus: FilePlus2,
  files: FileStack,
  folder: FolderOpen,
  gift: Gift,
  gitFork: GitFork,
  handshake: Handshake,
  headphones: HeadphonesIcon,
  layout: LayoutDashboard,
  list: ListChecks,
  message: MessageCircle,
  package: PackageCheck,
  percent: Percent,
  receipt: Receipt,
  settings: Settings,
  shield: ShieldCheck,
  truck: Truck,
  upload: UploadCloud,
  user: User,
  wallet: Wallet,
  wrench: Wrench,
};

const MODE_LABELS: Record<MilanoOSMode, string> = {
  operator: "Execution Center",
  client: "Private Matter Access",
  va: "Operations Desk",
  alliance: "Alliance Workspace",
};

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/portal") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupNavigation(nav: MilanoOSNavItem[]) {
  const groups = new Map<string, MilanoOSNavItem[]>();
  for (const item of nav) {
    const group = item.group ?? "Workspace";
    const existing = groups.get(group) ?? [];
    existing.push(item);
    groups.set(group, existing);
  }
  return Array.from(groups.entries());
}

function BrandMark() {
  return (
    <span className="ms-os-brand-mark" aria-hidden="true">
      <span className="ms-os-brand-mark__ring" />
      <span className="ms-os-brand-mark__m">M</span>
      <span className="ms-os-brand-mark__spark" />
    </span>
  );
}

function StatusPill({ item }: { item: MilanoOSStatusItem }) {
  return (
    <span className={`ms-os-status ms-os-status--${item.tone ?? "gold"}`}>
      <span className="ms-os-status__dot" aria-hidden="true" />
      <span>{item.label}</span>
      {item.value ? <strong>{item.value}</strong> : null}
    </span>
  );
}

export function MilanoOSShell({
  children,
  mode,
  nav,
  eyebrow,
  title,
  subtitle,
  brandSubtitle,
  topStrip,
  sidebarContext,
  statusItems = [],
  identity,
  primaryAction,
  footerNote = "Secure document execution infrastructure",
  signOut = true,
  maxWidth = 1520,
  contentClassName = "",
}: MilanoOSShellProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");

  const groupedNav = useMemo(() => groupNavigation(nav), [nav]);
  const activeItem = useMemo(
    () => nav.find((item) => isActiveRoute(pathname, item.href)),
    [nav, pathname],
  );

  const paletteItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return nav;
    return nav.filter((item) =>
      `${item.label} ${item.group ?? ""} ${item.hint ?? ""}`.toLowerCase().includes(needle),
    );
  }, [nav, query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setPaletteOpen(false);
    setQuery("");
  }, [pathname]);

  const shellStyle = {
    "--ms-os-content-max": `${maxWidth}px`,
    "--ms-os-strip-offset": topStrip ? "calc(52px + var(--sa-top))" : "0px",
  } as CSSProperties;

  const navigation = (
    <>
      <div className="ms-os-sidebar__brand">
        <BrandMark />
        <div className="min-w-0">
          <div className="ms-os-sidebar__brand-name">The Milano Seal™</div>
          <div className="ms-os-sidebar__brand-sub">{brandSubtitle}</div>
        </div>
      </div>

      {sidebarContext ? <div className="ms-os-sidebar__context">{sidebarContext}</div> : null}

      <nav className="ms-os-nav" aria-label={`${MODE_LABELS[mode]} navigation`}>
        {groupedNav.map(([group, items]) => (
          <div className="ms-os-nav__group" key={group}>
            <div className="ms-os-nav__group-label">{group}</div>
            <div className="ms-os-nav__items">
              {items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActiveRoute(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`ms-os-nav__item ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="ms-os-nav__icon"><Icon size={16} strokeWidth={1.7} /></span>
                    <span className="ms-os-nav__copy">
                      <span className="ms-os-nav__label">{item.label}</span>
                      {item.hint ? <span className="ms-os-nav__hint">{item.hint}</span> : null}
                    </span>
                    <ChevronRight className="ms-os-nav__chevron" size={13} strokeWidth={1.7} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="ms-os-sidebar__footer">
        {identity ? (
          <div className="ms-os-identity">
            <span className="ms-os-identity__avatar">{identity.name.charAt(0).toUpperCase()}</span>
            <span className="ms-os-identity__copy">
              <strong>{identity.name}</strong>
              {identity.meta ? <small>{identity.meta}</small> : null}
            </span>
          </div>
        ) : null}

        <div className="ms-os-sidebar__footer-note">{footerNote}</div>

        {signOut ? (
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="ms-os-signout">
              <LogOut size={14} strokeWidth={1.7} />
              Sign out
            </button>
          </form>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="ms-os-shell" data-mode={mode} style={shellStyle}>
      {topStrip ? <div className="ms-os-strip">{topStrip}</div> : null}

      <div className="ms-os-shell__atmosphere" aria-hidden="true">
        <div className="ms-os-shell__grid" />
        <div className="ms-os-shell__beam" />
        <div className="ms-os-shell__orb ms-os-shell__orb--a" />
        <div className="ms-os-shell__orb ms-os-shell__orb--b" />
      </div>

      <aside className="ms-os-sidebar hidden lg:flex">{navigation}</aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              className="ms-os-mobile-backdrop lg:hidden"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="ms-os-mobile-drawer lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={`${MODE_LABELS[mode]} navigation`}
              initial={reduceMotion ? false : { x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { x: -24, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <button type="button" className="ms-os-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                <X size={18} />
              </button>
              {navigation}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="ms-os-main">
        <header className="ms-os-topbar">
          <div className="ms-os-topbar__inner">
            <div className="ms-os-topbar__left">
              <button type="button" className="ms-os-menu lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <div className="ms-os-topbar__eyebrow">{eyebrow}</div>
                <div className="ms-os-topbar__title-row">
                  <h1 className="ms-os-topbar__title">{activeItem?.label ?? title}</h1>
                  <span className="ms-os-topbar__route hidden sm:inline">{pathname}</span>
                </div>
                <p className="ms-os-topbar__subtitle">{subtitle}</p>
              </div>
            </div>

            <div className="ms-os-topbar__right">
              <div className="ms-os-topbar__statuses hidden xl:flex">
                {statusItems.slice(0, 2).map((item) => <StatusPill key={`${item.label}-${item.value ?? ""}`} item={item} />)}
              </div>
              <button type="button" className="ms-os-command-trigger" onClick={() => setPaletteOpen(true)} aria-label="Open workspace command palette">
                <Search size={15} strokeWidth={1.8} />
                <span className="hidden md:inline">Jump</span>
                <kbd className="hidden md:inline">⌘K</kbd>
              </button>
              {primaryAction ? (
                <Link href={primaryAction.href} className="ms-os-primary-action">
                  <Sparkles size={14} strokeWidth={1.8} />
                  <span>{primaryAction.label}</span>
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        {statusItems.length > 0 ? (
          <div className="ms-os-mobile-statuses xl:hidden">
            {statusItems.map((item) => <StatusPill key={`${item.label}-${item.value ?? ""}`} item={item} />)}
          </div>
        ) : null}

        <motion.main
          key={pathname}
          className={`ms-os-shell__content ms-safe-bottom ${contentClassName}`}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.main>
      </div>

      <AnimatePresence>
        {paletteOpen ? (
          <motion.div
            className="ms-os-palette-layer"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPaletteOpen(false);
            }}
          >
            <motion.section
              className="ms-os-palette"
              role="dialog"
              aria-modal="true"
              aria-label="Workspace navigation"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ms-os-palette__search">
                <Search size={18} strokeWidth={1.7} />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${MODE_LABELS[mode]}…`}
                  aria-label="Search workspace destinations"
                />
                <button type="button" onClick={() => setPaletteOpen(false)} aria-label="Close command palette">ESC</button>
              </div>
              <div className="ms-os-palette__meta">
                <span>THE MILANO SEAL™</span>
                <span>{MODE_LABELS[mode]}</span>
              </div>
              <div className="ms-os-palette__results">
                {paletteItems.length ? paletteItems.map((item) => {
                  const Icon = ICONS[item.icon];
                  const active = isActiveRoute(pathname, item.href);
                  return (
                    <Link key={item.href} href={item.href} className={`ms-os-palette__item ${active ? "is-active" : ""}`}>
                      <span className="ms-os-palette__item-icon"><Icon size={17} strokeWidth={1.7} /></span>
                      <span className="ms-os-palette__item-copy">
                        <strong>{item.label}</strong>
                        <small>{item.hint ?? item.group ?? "Workspace"}</small>
                      </span>
                      <span className="ms-os-palette__item-route">{item.href}</span>
                      <ChevronRight size={14} />
                    </Link>
                  );
                }) : (
                  <div className="ms-os-palette__empty">No workspace destination matches “{query}”.</div>
                )}
              </div>
              <div className="ms-os-palette__footer">
                <span><Command size={12} /> K to open</span>
                <span>ESC to close</span>
                <span>Navigation only · no state mutation</span>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
