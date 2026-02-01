-- Enums for notifications and m2
CREATE TYPE public.notification_type AS ENUM (
  'listing_approved',
  'listing_rejected',
  'renewal_required',
  'listing_removed',
  'new_chat_message',
  'new_tour_request',
  'tour_accepted',
  'tour_denied',
  'tour_rescheduled',
  'tour_reminder',
  'contract_sent',
  'contract_completed'
);
CREATE TYPE public.m2_job_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- notifications (in-app inbox)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT,
  body TEXT,
  payload JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- m2_jobs (m² team captures pro media for listings)
CREATE TABLE public.m2_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  status public.m2_job_status NOT NULL DEFAULT 'pending',
  assigned_to_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_m2_jobs_listing_id ON public.m2_jobs(listing_id);
CREATE INDEX idx_m2_jobs_status ON public.m2_jobs(status);

-- RLS: notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Insert via Edge Functions / scheduled jobs (service role bypasses RLS)

-- RLS: m2_jobs
-- m² team and listing owners can read; m² team can manage
ALTER TABLE public.m2_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing owners can read m2 jobs"
  ON public.m2_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = m2_jobs.listing_id
        AND (l.landlord_user_id = auth.uid()
             OR l.agent_user_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.agency_staff s WHERE s.agency_id = l.agency_id AND s.user_id = auth.uid()))
    )
  );

-- m² team: check profiles.roles->>'m2_team' = true
CREATE POLICY "m2 team can read all jobs"
  ON public.m2_jobs FOR SELECT
  TO authenticated
  USING (
    (SELECT (roles->>'m2_team')::boolean FROM public.profiles WHERE user_id = auth.uid()) = true
  );

CREATE POLICY "m2 team can manage jobs"
  ON public.m2_jobs FOR ALL
  TO authenticated
  USING (
    (SELECT (roles->>'m2_team')::boolean FROM public.profiles WHERE user_id = auth.uid()) = true
  );

-- Updated_at trigger
CREATE TRIGGER m2_jobs_updated_at
  BEFORE UPDATE ON public.m2_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
