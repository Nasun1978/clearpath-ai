-- =============================================================================
-- RipeSpot — Stripe Billing Migration
-- Run in Supabase SQL Editor. Idempotent — safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: user_subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id        TEXT,
  stripe_subscription_id    TEXT,
  stripe_price_id           TEXT,
  plan_tier                 TEXT        NOT NULL DEFAULT 'trial'
    CHECK (plan_tier IN ('trial','starter','pro','enterprise','pay_per_project','cancelled')),
  subscription_status       TEXT        NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing','active','past_due','cancelled','unpaid','paused')),
  trial_ends_at             TIMESTAMPTZ,
  trial_used                BOOLEAN     NOT NULL DEFAULT false,
  current_period_end        TIMESTAMPTZ,
  project_id                TEXT,                   -- for pay_per_project tier
  project_access_expires_at TIMESTAMPTZ,            -- for pay_per_project tier
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ---------------------------------------------------------------------------
-- Auto-update updated_at on every row change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER trg_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own row only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions' AND policyname = 'users_select_own_subscription'
  ) THEN
    CREATE POLICY users_select_own_subscription
      ON user_subscriptions
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can UPDATE their own row (e.g. dismiss trial banner flag — future use)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions' AND policyname = 'users_update_own_subscription'
  ) THEN
    CREATE POLICY users_update_own_subscription
      ON user_subscriptions
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role bypasses RLS and handles all INSERTs via webhook handler.
-- No INSERT policy needed for users — the webhook (service role) owns writes.
