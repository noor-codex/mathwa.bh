-- Enums for agency-related tables
CREATE TYPE public.agency_status AS ENUM ('pending', 'active', 'suspended');

-- agencies
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cr_number TEXT,
  status public.agency_status NOT NULL DEFAULT 'pending',
  primary_contact_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  logo_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- agency_staff (membership + role within agency)
CREATE TYPE public.agency_staff_role AS ENUM ('agent', 'listing_manager', 'admin');

CREATE TABLE public.agency_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role public.agency_staff_role NOT NULL DEFAULT 'agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, user_id)
);

-- agency_referral_codes
CREATE TABLE public.agency_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- agency_credit_wallets
CREATE TABLE public.agency_credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- agency_credit_ledger (audit trail for credit movements)
CREATE TABLE public.agency_credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.agency_credit_wallets(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: agencies
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies are readable by authenticated users"
  ON public.agencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create agencies"
  ON public.agencies FOR INSERT
  TO authenticated
  WITH CHECK (primary_contact_user_id = auth.uid() OR primary_contact_user_id IS NULL);

CREATE POLICY "Agency staff can update their agency"
  ON public.agencies FOR UPDATE
  USING (
    primary_contact_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.agency_staff
      WHERE agency_id = agencies.id AND user_id = auth.uid()
    )
  );

-- RLS: agency_staff
ALTER TABLE public.agency_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read agency_staff for agencies they belong to"
  ON public.agency_staff FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.agency_staff AS s
      WHERE s.agency_id = agency_staff.agency_id
        AND s.user_id = auth.uid()
        AND s.role IN ('admin', 'listing_manager')
    )
  );

CREATE POLICY "Primary contact can add themselves as first staff"
  ON public.agency_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agencies a
      WHERE a.id = agency_staff.agency_id
        AND a.primary_contact_user_id = auth.uid()
    )
  );

CREATE POLICY "Agency admins can manage staff"
  ON public.agency_staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_staff AS s
      WHERE s.agency_id = agency_staff.agency_id
        AND s.user_id = auth.uid()
        AND s.role = 'admin'
    )
  );

-- RLS: agency_referral_codes
ALTER TABLE public.agency_referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency staff can read referral codes"
  ON public.agency_referral_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_staff
      WHERE agency_id = agency_referral_codes.agency_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Agency admins can manage referral codes"
  ON public.agency_referral_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_staff
      WHERE agency_id = agency_referral_codes.agency_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Trigger: create wallet when agency is created
CREATE OR REPLACE FUNCTION public.handle_new_agency()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agency_credit_wallets (agency_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_agency_created
  AFTER INSERT ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_agency();

-- RLS: agency_credit_wallets
ALTER TABLE public.agency_credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency staff can read wallets"
  ON public.agency_credit_wallets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_staff
      WHERE agency_id = agency_credit_wallets.agency_id AND user_id = auth.uid()
    )
  );

-- Ledger: service role / edge functions typically update; restrict writes
ALTER TABLE public.agency_credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency staff can read ledger"
  ON public.agency_credit_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_credit_wallets w
      JOIN public.agency_staff s ON s.agency_id = w.agency_id
      WHERE w.id = agency_credit_ledger.wallet_id AND s.user_id = auth.uid()
    )
  );

-- Updated_at triggers
CREATE TRIGGER agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER agency_staff_updated_at
  BEFORE UPDATE ON public.agency_staff
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER agency_referral_codes_updated_at
  BEFORE UPDATE ON public.agency_referral_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER agency_credit_wallets_updated_at
  BEFORE UPDATE ON public.agency_credit_wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
