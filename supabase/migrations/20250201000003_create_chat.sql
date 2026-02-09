-- Enums for chat
CREATE TYPE public.message_type AS ENUM ('text', 'system', 'structured_payload');

-- chat_threads (one per listing per tenant)
CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  manager_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  is_pinned_read_only BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, tenant_user_id)
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

-- Support threads table for Mathwa Support chats
CREATE TABLE public.support_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support messages table
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'support')),
  sender_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_threads_listing_id ON public.chat_threads(listing_id);
CREATE INDEX idx_chat_threads_tenant_user_id ON public.chat_threads(tenant_user_id);
CREATE INDEX idx_chat_threads_manager_user_id ON public.chat_threads(manager_user_id);
CREATE INDEX idx_chat_threads_archived ON public.chat_threads(tenant_user_id, is_archived);
CREATE INDEX idx_chat_threads_pinned ON public.chat_threads(tenant_user_id, is_pinned);
CREATE INDEX idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX idx_support_threads_user_id ON public.support_threads(user_id);
CREATE INDEX idx_support_messages_thread_id ON public.support_messages(thread_id);

-- RLS: chat_threads
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read their threads"
  ON public.chat_threads FOR SELECT
  TO authenticated
  USING (
    tenant_user_id = auth.uid()
    OR manager_user_id = auth.uid()
  );

CREATE POLICY "Participants can insert threads"
  ON public.chat_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_user_id = auth.uid()
    OR manager_user_id = auth.uid()
  );

CREATE POLICY "Participants can update their threads"
  ON public.chat_threads FOR UPDATE
  TO authenticated
  USING (
    tenant_user_id = auth.uid()
    OR manager_user_id = auth.uid()
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
        AND (t.tenant_user_id = auth.uid() OR t.manager_user_id = auth.uid())
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
        AND (t.tenant_user_id = auth.uid() OR t.manager_user_id = auth.uid())
        AND NOT t.is_pinned_read_only
    )
  );

-- RLS for support_threads
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own support threads"
  ON public.support_threads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own support threads"
  ON public.support_threads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own support threads"
  ON public.support_threads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS for support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages in own support threads"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to own support threads"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_type = 'user'
    AND sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND t.user_id = auth.uid()
    )
  );

-- Updated_at triggers
CREATE TRIGGER chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER support_threads_updated_at
  BEFORE UPDATE ON public.support_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
