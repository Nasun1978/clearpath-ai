"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  accent?: "teal" | "amber" | "purple" | "blue" | "emerald";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function HomeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function PipelineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function ZoningIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function ChecklistIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
function PilotIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ComplianceIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}
function MarketplaceIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function DocumentsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  );
}
function BillingIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ProposalsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  );
}
function TaxIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <HomeIcon /> },
    ],
  },
  {
    label: "Development",
    items: [
      { href: "/dashboard/projects", label: "Projects", icon: <FolderIcon /> },
      { href: "/dashboard/deals", label: "Deal Pipeline", icon: <PipelineIcon /> },
      { href: "/dashboard/proposals", label: "Proposals", icon: <ProposalsIcon /> },
    ],
  },
  {
    label: "Analysis",
    items: [
      { href: "/dashboard/financial", label: "Financial Analysis", icon: <ChartIcon /> },
      { href: "/dashboard/zoning", label: "Zoning Lookup", icon: <ZoningIcon /> },
      { href: "/dashboard/checklist", label: "LIHTC Checklist", icon: <ChecklistIcon />, accent: "teal" },
      { href: "/dashboard/pilot-analysis", label: "PILOT Analysis", icon: <PilotIcon />, accent: "purple" },
      { href: "/dashboard/compliance", label: "HOME Compliance", icon: <ComplianceIcon /> },
      { href: "/dashboard/geomap", label: "Geomap", icon: <MapIcon />, accent: "blue" },
      { href: "/dashboard/tax-incentive-maps", label: "Tax Incentive Districts", icon: <TaxIcon /> },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { href: "/marketplace", label: "Vendor Marketplace", icon: <MarketplaceIcon />, accent: "amber" },
      { href: "/dashboard/documents", label: "Documents", icon: <DocumentsIcon /> },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: <BillingIcon /> },
      { href: "/dashboard/about", label: "About", icon: <InfoIcon /> },
    ],
  },
];

const ACCENT_ACTIVE: Record<string, string> = {
  teal:    "bg-teal-900/50 text-teal-300 border-l-2 border-teal-500",
  amber:   "bg-amber-900/50 text-amber-300 border-l-2 border-amber-500",
  purple:  "bg-purple-900/50 text-purple-300 border-l-2 border-purple-500",
  blue:    "bg-blue-900/50 text-blue-300 border-l-2 border-blue-500",
  emerald: "bg-emerald-900/50 text-emerald-300 border-l-2 border-emerald-500",
};

const ACCENT_HOVER: Record<string, string> = {
  teal:    "hover:bg-teal-900/20 hover:text-teal-300",
  amber:   "hover:bg-amber-900/20 hover:text-amber-300",
  purple:  "hover:bg-purple-900/20 hover:text-purple-300",
  blue:    "hover:bg-blue-900/20 hover:text-blue-300",
  emerald: "hover:bg-emerald-900/20 hover:text-emerald-300",
};

interface DashboardSidebarProps {
  deadlineCount?: number;
  onBellClick?: () => void;
}

export default function DashboardSidebar({ deadlineCount = 0, onBellClick }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#080E1A] border-r border-slate-800/80 transition-all duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/60 shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="flex flex-col">
            <span className="text-base font-bold font-serif tracking-tight text-white leading-none">RipeSpot</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Dev Platform</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const accentKey = item.accent ?? "";
                const activeClass = active
                  ? accentKey
                    ? ACCENT_ACTIVE[accentKey]
                    : "bg-slate-800 text-white border-l-2 border-slate-400"
                  : "";
                const hoverClass = !active
                  ? accentKey
                    ? ACCENT_HOVER[accentKey]
                    : "hover:bg-slate-800/60 hover:text-slate-200"
                  : "";

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors
                        ${active ? activeClass : `text-slate-400 ${hoverClass}`}
                        ${collapsed ? "justify-center" : ""}
                      `}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={`shrink-0 border-t border-slate-800/60 p-2 flex ${collapsed ? "flex-col items-center gap-2" : "items-center gap-2"}`}>
        {/* Notification bell */}
        <button
          onClick={onBellClick}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Deadline notifications"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {deadlineCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold px-0.5">
              {deadlineCount}
            </span>
          )}
        </button>

        {/* Support */}
        <a
          href="mailto:steven@ripespotdevelopment.com?subject=RipeSpot%20Question"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Contact support"
          title="Contact Support"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </a>

        {/* New Proposal CTA */}
        {!collapsed && (
          <Link
            href="/submit"
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-light transition-colors text-center"
          >
            + Proposal
          </Link>
        )}
        {collapsed && (
          <Link
            href="/submit"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-light transition-colors"
            title="New Proposal"
          >
            +
          </Link>
        )}
      </div>
    </aside>
  );
}
