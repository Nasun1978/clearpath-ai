// ============================================================================
// RipeSpot — Utility Functions
// ============================================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ProposalStatus, ComplianceResult, SeverityLevel, CreditType } from "@/types";

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format currency values */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format percentage */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return "—";
  return `${value.toFixed(decimals)}%`;
}

/** Format DSCR */
export function formatDscr(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(2)}x`;
}

/** Status display config */
export const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-slate-400", bgColor: "bg-slate-500/15" },
  received: { label: "Received", color: "text-blue-400", bgColor: "bg-blue-500/15" },
  processing: { label: "Processing", color: "text-amber-400", bgColor: "bg-amber-500/15" },
  in_review: { label: "In Review", color: "text-cyan-400", bgColor: "bg-cyan-500/15" },
  deficiency: { label: "Deficiency", color: "text-orange-400", bgColor: "bg-orange-500/15" },
  approved: { label: "Approved", color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
  approved_with_conditions: { label: "Approved w/ Conditions", color: "text-teal-400", bgColor: "bg-teal-500/15" },
  denied: { label: "Denied", color: "text-red-400", bgColor: "bg-red-500/15" },
  withdrawn: { label: "Withdrawn", color: "text-slate-400", bgColor: "bg-slate-500/15" },
};

/** Compliance result display config */
export const RESULT_CONFIG: Record<ComplianceResult, { label: string; color: string; icon: string }> = {
  pass: { label: "Pass", color: "text-emerald-400", icon: "✓" },
  fail: { label: "Fail", color: "text-red-400", icon: "✗" },
  needs_review: { label: "Review", color: "text-amber-400", icon: "?" },
  not_applicable: { label: "N/A", color: "text-slate-400", icon: "—" },
};

/** Severity display config */
export const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string }> = {
  critical: { label: "Critical", color: "text-red-400" },
  warning: { label: "Warning", color: "text-amber-400" },
  informational: { label: "Info", color: "text-slate-400" },
};

/** Credit type labels */
export const CREDIT_TYPE_LABELS: Record<CreditType, string> = {
  lihtc_4pct: "4% LIHTC",
  lihtc_9pct: "9% LIHTC",
  home: "HOME",
  htf: "HTF",
  cdbg: "CDBG",
  rad: "RAD",
  mixed: "Mixed",
  other: "Other",
};

/** Relative time display */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
