-- Rental Manager profiles: onboarding data, verification, company link
CREATE TABLE public.rental_manager_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  manager_type TEXT NOT NULL CHECK (manager_type IN ('private_owner', 'independent_agent', 'company_agent')),
  -- Identity
  full_name TEXT NOT NULL,
  cpr_or_passport TEXT,
  phone TEXT,
  -- RERA (agents only)
  rera_cert_path TEXT,
  rera_verified BOOLEAN NOT NULL DEFAULT false,
  -- Ownership/authorization docs
  verification_doc_path TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  -- Company link
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  -- Limits
  active_listing_count INTEGER NOT NULL DEFAULT 0,
  max_free_listings INTEGER NOT NULL DEFAULT 1,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rental_manager_profiles_agency_id ON public.rental_manager_profiles(agency_id);
CREATE INDEX idx_rental_manager_profiles_manager_type ON public.rental_manager_profiles(manager_type);

-- RLS
ALTER TABLE public.rental_manager_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own manager profile
CREATE POLICY "Users can manage own manager profile"
  ON public.rental_manager_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Authenticated users can read any manager profile (for listing detail display)
CREATE POLICY "Authenticated users can read any manager profile"
  ON public.rental_manager_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Updated_at trigger
CREATE TRIGGER rental_manager_profiles_updated_at
  BEFORE UPDATE ON public.rental_manager_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
