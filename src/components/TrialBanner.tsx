"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { UserSubscription } from "@/types";

const DISMISS_KEY = "trial_banner_dismissed";

export default function TrialBanner() {
  const [subscription, setSubscription] = useState<Partial<UserSubscription> | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Respect per-session dismissal immediately on mount
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
      return;
    }

    async function fetchSubscription() {
      try {
        const res = await fetch("/api/user/subscription");
        if (res.ok) {
          const data = (await res.json()) as Partial<UserSubscription>;
          setSubscription(data);
        }
      } catch {
        // Non-critical — fail silently
      }
    }
    fetchSubscription();
  }, []);

  function dismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
  }

  if (dismissed) return null;

  // Only render for trialing users whose trial ends within 3 days
  if (subscription?.subscription_status !== "trialing") return null;
  if (!subscription.trial_ends_at) return null;

  const msUntilEnd = new Date(subscription.trial_ends_at).getTime() - Date.now();
  const daysLeft   = Math.ceil(msUntilEnd / (1000 * 60 * 60 * 24));

  if (daysLeft > 3) return null;

  // Choose styling and message based on urgency
  let bgClass: string;
  let message: string;

  if (daysLeft <= 0) {
    bgClass = "bg-red-900/50 border-red-500/50 text-red-200";
    message = "Your trial ends today. Upgrade now to keep your data.";
  } else if (daysLeft === 1) {
    bgClass = "bg-amber-900/40 border-amber-500/40 text-amber-200";
    message = "Trial ending tomorrow — upgrade to keep access.";
  } else {
    bgClass = "bg-amber-900/30 border-amber-500/30 text-amber-200";
    message = `Trial ending in ${daysLeft} days — upgrade to keep your data.`;
  }

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 border rounded-lg text-sm ${bgClass}`}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/pricing"
          className="text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          Upgrade Now →
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss trial banner"
          className="text-lg leading-none opacity-60 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
}
