-- Add chat thread status columns
ALTER TABLE public.chat_threads
  ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_starred BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_muted BOOLEAN NOT NULL DEFAULT false;

-- Indexes for filtering
CREATE INDEX idx_chat_threads_archived ON public.chat_threads(tenant_user_id, is_archived);
CREATE INDEX idx_chat_threads_pinned ON public.chat_threads(tenant_user_id, is_pinned);

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

-- Indexes for support
CREATE INDEX idx_support_threads_user_id ON public.support_threads(user_id);
CREATE INDEX idx_support_messages_thread_id ON public.support_messages(thread_id);

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

-- Updated_at trigger for support_threads
CREATE TRIGGER support_threads_updated_at
  BEFORE UPDATE ON public.support_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
