-- Enums for moderation
CREATE TYPE public.moderation_entity_type AS ENUM ('listing', 'agency', 'manager_verification');
CREATE TYPE public.moderation_queue_status AS ENUM ('pending', 'approved', 'rejected');

-- moderation_queue
CREATE TABLE public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type public.moderation_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  status public.moderation_queue_status NOT NULL DEFAULT 'pending',
  submitted_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reviewed_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- moderation_decisions (audit log of decisions)
CREATE TABLE public.moderation_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES public.moderation_queue(id) ON DELETE CASCADE,
  decision public.moderation_queue_status NOT NULL,
  decided_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX idx_moderation_queue_entity ON public.moderation_queue(entity_type, entity_id);

-- RLS: moderation_queue
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submitters can create moderation items"
  ON public.moderation_queue FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by_user_id = auth.uid());

CREATE POLICY "Moderators can read moderation queue"
  ON public.moderation_queue FOR SELECT
  TO authenticated
  USING (
    (SELECT (roles->>'moderator')::boolean FROM public.profiles WHERE user_id = auth.uid()) = true
  );

CREATE POLICY "Moderators can update moderation queue"
  ON public.moderation_queue FOR UPDATE
  TO authenticated
  USING (
    (SELECT (roles->>'moderator')::boolean FROM public.profiles WHERE user_id = auth.uid()) = true
  );

-- RLS: moderation_decisions
ALTER TABLE public.moderation_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can read decisions"
  ON public.moderation_decisions FOR SELECT
  TO authenticated
  USING (
    (SELECT (roles->>'moderator')::boolean FROM public.profiles WHERE user_id = auth.uid()) = true
  );

CREATE POLICY "Moderators can create decisions"
  ON public.moderation_decisions FOR INSERT
  TO authenticated
  WITH CHECK (
    decided_by_user_id = auth.uid()
    AND (SELECT (roles->>'moderator')::boolean FROM public.profiles WHERE user_id = auth.uid()) = true
  );

-- Updated_at trigger
CREATE TRIGGER moderation_queue_updated_at
  BEFORE UPDATE ON public.moderation_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
