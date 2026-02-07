-- listing_views: Track which listings users have viewed
CREATE TABLE public.listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_listing_views_user_id ON public.listing_views(user_id);
CREATE INDEX idx_listing_views_listing_id ON public.listing_views(listing_id);
CREATE INDEX idx_listing_views_viewed_at ON public.listing_views(viewed_at);
CREATE INDEX idx_listing_views_user_listing ON public.listing_views(user_id, listing_id);

-- RLS
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own views"
  ON public.listing_views FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own views"
  ON public.listing_views FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
