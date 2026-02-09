-- Enums for tours and contracts
CREATE TYPE public.tour_request_status AS ENUM ('pending', 'accepted', 'denied', 'rescheduled', 'cancelled');
CREATE TYPE public.contract_status AS ENUM ('to_create', 'sent', 'completed', 'cancelled');

-- tour_requests
CREATE TABLE public.tour_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  manager_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  requested_slot TIMESTAMPTZ NOT NULL,
  status public.tour_request_status NOT NULL DEFAULT 'pending',
  rescheduled_slot TIMESTAMPTZ,
  reschedule_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  manager_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status public.contract_status NOT NULL DEFAULT 'to_create',
  tenant_info JSONB,
  contract_file_path TEXT,
  esign_provider TEXT,
  esign_external_id TEXT,
  esign_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tour_requests_listing_id ON public.tour_requests(listing_id);
CREATE INDEX idx_tour_requests_tenant_user_id ON public.tour_requests(tenant_user_id);
CREATE INDEX idx_tour_requests_manager_user_id ON public.tour_requests(manager_user_id);
CREATE INDEX idx_tour_requests_requested_slot ON public.tour_requests(requested_slot);
CREATE INDEX idx_contracts_listing_id ON public.contracts(listing_id);
CREATE INDEX idx_contracts_tenant_user_id ON public.contracts(tenant_user_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);

-- RLS: tour_requests
ALTER TABLE public.tour_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read tour requests"
  ON public.tour_requests FOR SELECT
  TO authenticated
  USING (
    tenant_user_id = auth.uid()
    OR manager_user_id = auth.uid()
  );

CREATE POLICY "Tenants can create tour requests"
  ON public.tour_requests FOR INSERT
  TO authenticated
  WITH CHECK (tenant_user_id = auth.uid());

CREATE POLICY "Managers can update tour requests"
  ON public.tour_requests FOR UPDATE
  TO authenticated
  USING (manager_user_id = auth.uid());

-- Allow tenants to cancel their own tour requests
CREATE POLICY "Tenants can cancel own tour requests"
  ON public.tour_requests FOR UPDATE
  TO authenticated
  USING (tenant_user_id = auth.uid());

-- RLS: contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read contracts"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (
    tenant_user_id = auth.uid()
    OR manager_user_id = auth.uid()
  );

CREATE POLICY "Participants can create contracts"
  ON public.contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_user_id = auth.uid()
    OR manager_user_id = auth.uid()
  );

CREATE POLICY "Participants can update contracts"
  ON public.contracts FOR UPDATE
  TO authenticated
  USING (
    tenant_user_id = auth.uid()
    OR manager_user_id = auth.uid()
  );

-- Updated_at triggers
CREATE TRIGGER tour_requests_updated_at
  BEFORE UPDATE ON public.tour_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
