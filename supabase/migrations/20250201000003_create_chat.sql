-- Enums for chat
CREATE TYPE public.counterparty_type AS ENUM ('agent', 'landlord');
CREATE TYPE public.message_type AS ENUM ('text', 'system', 'structured_payload');

-- chat_threads (one per listing per tenant)
CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  counterparty_type public.counterparty_type NOT NULL,
  agent_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  landlord_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  is_pinned_read_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, tenant_user_id),
  CONSTRAINT chat_counterparty_check CHECK (
    (counterparty_type = 'agent' AND agent_user_id IS NOT NULL AND landlord_user_id IS NULL)
    OR (counterparty_type = 'landlord' AND landlord_user_id IS NOT NULL AND agent_user_id IS NULL)
  )
);

-- chat_messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  message_type public.message_type NOT NULL DEFAULT 'text',
  body TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT message_content_check CHECK (
    (message_type = 'text' AND body IS NOT NULL)
    OR (message_type = 'structured_payload' AND payload IS NOT NULL)
    OR (message_type = 'system')
  )
);

-- Indexes
CREATE INDEX idx_chat_threads_listing_id ON public.chat_threads(listing_id);
CREATE INDEX idx_chat_threads_tenant_user_id ON public.chat_threads(tenant_user_id);
CREATE INDEX idx_chat_threads_agent_user_id ON public.chat_threads(agent_user_id);
CREATE INDEX idx_chat_threads_landlord_user_id ON public.chat_threads(landlord_user_id);
CREATE INDEX idx_chat_messages_thread_id ON public.chat_messages(thread_id);

-- RLS: chat_threads
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read their threads"
  ON public.chat_threads FOR SELECT
  TO authenticated
  USING (
    tenant_user_id = auth.uid()
    OR agent_user_id = auth.uid()
    OR landlord_user_id = auth.uid()
  );

-- Thread creation: via Edge Function or allow tenant/agent/landlord to insert when valid
CREATE POLICY "Participants can insert threads for their listing"
  ON public.chat_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_user_id = auth.uid()
    OR agent_user_id = auth.uid()
    OR landlord_user_id = auth.uid()
  );

CREATE POLICY "Participants can update their threads"
  ON public.chat_threads FOR UPDATE
  TO authenticated
  USING (
    tenant_user_id = auth.uid()
    OR agent_user_id = auth.uid()
    OR landlord_user_id = auth.uid()
  );

-- RLS: chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread participants can read messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND (t.tenant_user_id = auth.uid() OR t.agent_user_id = auth.uid() OR t.landlord_user_id = auth.uid())
    )
  );

CREATE POLICY "Thread participants can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND (t.tenant_user_id = auth.uid() OR t.agent_user_id = auth.uid() OR t.landlord_user_id = auth.uid())
        AND NOT t.is_pinned_read_only
    )
  );

-- Updated_at trigger
CREATE TRIGGER chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
