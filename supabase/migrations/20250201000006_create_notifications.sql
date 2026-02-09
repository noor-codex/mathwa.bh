-- Enums for notifications
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

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

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
