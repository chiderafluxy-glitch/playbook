-- ================================================================
-- PLAYBOOK — SUPABASE MIGRATION
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================

-- 1. Fix RLS on users table (security issue)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 2. Extend profiles table with Playbook columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS has_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gmail_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_platform text,
  ADD COLUMN IF NOT EXISTS email_platform_key text,
  ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 1;

-- 3. user_onboarding — stores all 4 onboarding steps per user
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  niche text,
  audience text,
  problem text,
  offer_name text,
  offer_price text,
  offer_sentence text,
  step integer NOT NULL DEFAULT 1,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own onboarding" ON public.user_onboarding
  FOR ALL USING (auth.uid() = user_id);

-- 4. generation_counts — per-tool monthly usage caps
CREATE TABLE IF NOT EXISTS public.generation_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool text NOT NULL CHECK (tool IN ('lead_magnet','dream_100','email_sequence','linkedin','scorecard','tripwire')),
  month text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool, month)
);

ALTER TABLE public.generation_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own generation counts" ON public.generation_counts
  FOR ALL USING (auth.uid() = user_id);

-- 5. generated_outputs — persists AI outputs per user per tool
CREATE TABLE IF NOT EXISTS public.generated_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool text NOT NULL CHECK (tool IN ('lead_magnet','dream_100','email_sequence','linkedin','scorecard','tripwire')),
  output jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool)
);

ALTER TABLE public.generated_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own outputs" ON public.generated_outputs
  FOR ALL USING (auth.uid() = user_id);

-- 6. stripe_events — webhook idempotency log (service role only)
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — only accessible via service role key

-- 7. Auto-update updated_at function + triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_onboarding
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_gen_counts
  BEFORE UPDATE ON public.generation_counts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_outputs
  BEFORE UPDATE ON public.generated_outputs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Auto-create profile + onboarding row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, subscription_status, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    'basic',
    'inactive',
    false
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_onboarding (user_id, step)
  VALUES (NEW.id, 1)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. RPC function to safely increment generation counts
CREATE OR REPLACE FUNCTION public.increment_generation_count(
  p_user_id uuid,
  p_tool text,
  p_month text
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.generation_counts (user_id, tool, month, count)
  VALUES (p_user_id, p_tool, p_month, 1)
  ON CONFLICT (user_id, tool, month)
  DO UPDATE SET count = generation_counts.count + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- DONE. You should see these new tables in Table Editor:
-- • user_onboarding
-- • generation_counts  
-- • generated_outputs
-- • stripe_events
-- And these new columns on profiles:
-- • name, trial_ends_at, has_paid, gmail_connected,
-- • email_platform, email_platform_key, onboarding_step
-- ================================================================
