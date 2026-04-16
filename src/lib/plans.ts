// =============================================================================
// RipeSpot — Plan Definitions & Feature Gating
// =============================================================================
// Single source of truth for plan tiers, Stripe price IDs, and feature access.
// Price IDs are set after running /api/stripe/products-seed in development.
// =============================================================================

import type { PlanTier, PlanFeatures } from '@/types';

// Stripe Price IDs — set in .env.local after running the seed script.
// Each key maps to an environment variable; falls back to '' if unset.
export const STRIPE_PRICE_IDS = {
  starter_monthly:      process.env.STRIPE_PRICE_STARTER_MONTHLY      ?? '',
  starter_annual:       process.env.STRIPE_PRICE_STARTER_ANNUAL        ?? '',
  pro_monthly:          process.env.STRIPE_PRICE_PRO_MONTHLY           ?? '',
  pro_annual:           process.env.STRIPE_PRICE_PRO_ANNUAL            ?? '',
  enterprise_monthly:   process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY    ?? '',
  enterprise_annual:    process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL     ?? '',
  pay_per_project:      process.env.STRIPE_PRICE_PAY_PER_PROJECT       ?? '',
  // Consulting / one-time services
  strategy_session:     process.env.STRIPE_PRICE_STRATEGY_SESSION      ?? '',
  project_launch:       process.env.STRIPE_PRICE_PROJECT_LAUNCH        ?? '',
  lihtc_app_support:    process.env.STRIPE_PRICE_LIHTC_APP_SUPPORT     ?? '',
  monthly_advisory:     process.env.STRIPE_PRICE_MONTHLY_ADVISORY      ?? '',
  government_advisory:  process.env.STRIPE_PRICE_GOVERNMENT_ADVISORY   ?? '',
} as const;

// Pro feature set — reused for trial and pay_per_project
const PRO_FEATURES: PlanFeatures = {
  maxProjects:        'unlimited',
  maxDeals:           'unlimited',
  maxLIHTCChecklists: 'unlimited',
  maxTeamMembers:     'unlimited',
  maxStorageGB:       10,
  zoningLookup:       true,
  dealPipeline:       true,
  taxCreditAnalysis:  true,
  pilotAnalysis:      true,
  hudHomeGuide:       true,
  ffiecMaps:          true,
  taskNotifications:  true,
  customReports:      false,
  apiAccess:          false,
  dedicatedManager:   false,
  phoneSupport:       false,
};

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  // Trial has full Pro access during the 14-day window
  trial: { ...PRO_FEATURES },

  starter: {
    maxProjects:        3,
    maxDeals:           25,
    maxLIHTCChecklists: 1,
    maxTeamMembers:     5,
    maxStorageGB:       1,
    zoningLookup:       true,
    dealPipeline:       true,
    taxCreditAnalysis:  false,
    pilotAnalysis:      false,
    hudHomeGuide:       true,
    ffiecMaps:          true,
    taskNotifications:  false,
    customReports:      false,
    apiAccess:          false,
    dedicatedManager:   false,
    phoneSupport:       false,
  },

  pro: { ...PRO_FEATURES },

  enterprise: {
    maxProjects:        'unlimited',
    maxDeals:           'unlimited',
    maxLIHTCChecklists: 'unlimited',
    maxTeamMembers:     'unlimited',
    maxStorageGB:       'unlimited',
    zoningLookup:       true,
    dealPipeline:       true,
    taxCreditAnalysis:  true,
    pilotAnalysis:      true,
    hudHomeGuide:       true,
    ffiecMaps:          true,
    taskNotifications:  true,
    customReports:      true,
    apiAccess:          true,
    dedicatedManager:   true,
    phoneSupport:       true,
  },

  // Single-project purchase grants Pro-level access for that project
  pay_per_project: { ...PRO_FEATURES },

  cancelled: {
    maxProjects:        0,
    maxDeals:           0,
    maxLIHTCChecklists: 0,
    maxTeamMembers:     0,
    maxStorageGB:       0,
    zoningLookup:       false,
    dealPipeline:       false,
    taxCreditAnalysis:  false,
    pilotAnalysis:      false,
    hudHomeGuide:       false,
    ffiecMaps:          false,
    taskNotifications:  false,
    customReports:      false,
    apiAccess:          false,
    dedicatedManager:   false,
    phoneSupport:       false,
  },
};

// ---------------------------------------------------------------------------
// Helper: does this plan tier allow a specific feature?
// For numeric limits, returns true when the limit is non-zero (or 'unlimited').
// For boolean features, returns the value directly.
// ---------------------------------------------------------------------------
export function planAllows(tier: PlanTier, feature: keyof PlanFeatures): boolean {
  const value = PLAN_FEATURES[tier][feature];
  if (typeof value === 'boolean') return value;
  if (value === 'unlimited') return true;
  return (value as number) > 0;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------
export function getPlanDisplayName(tier: PlanTier): string {
  const names: Record<PlanTier, string> = {
    trial:           'Free Trial',
    starter:         'Starter',
    pro:             'Pro',
    enterprise:      'Enterprise',
    pay_per_project: 'Pay-Per-Project',
    cancelled:       'Cancelled',
  };
  return names[tier];
}

// Returns a Tailwind color class string for badge/pill rendering
export function getPlanColor(tier: PlanTier): string {
  const colors: Record<PlanTier, string> = {
    trial:           'bg-teal-500/20 text-teal-300 border-teal-500/40',
    starter:         'bg-slate-700/60 text-slate-300 border-slate-600/50',
    pro:             'bg-purple-500/20 text-purple-300 border-purple-500/40',
    enterprise:      'bg-amber-500/20 text-amber-300 border-amber-500/40',
    pay_per_project: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    cancelled:       'bg-slate-800/60 text-slate-500 border-slate-700/40',
  };
  return colors[tier];
}

// ---------------------------------------------------------------------------
// Map a Stripe price ID back to its plan tier — used in webhook handlers
// ---------------------------------------------------------------------------
export function priceToPlanTier(priceId: string): PlanTier | null {
  const { STRIPE_PRICE_IDS: p } = { STRIPE_PRICE_IDS };
  if (priceId === p.starter_monthly || priceId === p.starter_annual) return 'starter';
  if (priceId === p.pro_monthly     || priceId === p.pro_annual)     return 'pro';
  if (priceId === p.enterprise_monthly || priceId === p.enterprise_annual) return 'enterprise';
  if (priceId === p.pay_per_project) return 'pay_per_project';
  return null;
}
