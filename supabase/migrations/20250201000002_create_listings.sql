-- Enums for listings
CREATE TYPE public.listing_owner_type AS ENUM ('landlord', 'agency');
CREATE TYPE public.listing_status AS ENUM ('draft', 'pending_moderation', 'active', 'removed');
CREATE TYPE public.listing_moderation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.listing_media_type AS ENUM ('photo', 'video', 'tour3d', 'floorplan');

-- listings
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type public.listing_owner_type NOT NULL,
  landlord_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  agent_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  status public.listing_status NOT NULL DEFAULT 'draft',
  moderation_status public.listing_moderation_status DEFAULT 'pending',
  removed_reason_type TEXT,
  -- Publish/renewal
  publish_at TIMESTAMPTZ,
  renew_by TIMESTAMPTZ,
  last_renewed_at TIMESTAMPTZ,
  renewal_notified_at TIMESTAMPTZ,
  -- Listing details (Bahrain rentals)
  title TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER,
  currency TEXT DEFAULT 'BHD',
  beds INTEGER,
  baths INTEGER,
  area_sqm NUMERIC,
  city TEXT,
  area TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  is_uni_hub BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_m2 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT listing_owner_check CHECK (
    (owner_type = 'landlord' AND landlord_user_id IS NOT NULL)
    OR (owner_type = 'agency' AND agency_id IS NOT NULL AND agent_user_id IS NOT NULL)
  )
);

-- listing_media
CREATE TABLE public.listing_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  type public.listing_media_type NOT NULL DEFAULT 'photo',
  storage_path TEXT,
  external_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  uploaded_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT media_source_check CHECK (storage_path IS NOT NULL OR external_url IS NOT NULL)
);

-- saved_listings (tenant saves)
CREATE TABLE public.saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Indexes for common queries
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_moderation_status ON public.listings(moderation_status);
CREATE INDEX idx_listings_publish_at ON public.listings(publish_at);
CREATE INDEX idx_listings_renew_by ON public.listings(renew_by);
CREATE INDEX idx_listings_city ON public.listings(city);
CREATE INDEX idx_listings_is_uni_hub ON public.listings(is_uni_hub);
CREATE INDEX idx_listing_media_listing_id ON public.listing_media(listing_id);
CREATE INDEX idx_saved_listings_user_id ON public.saved_listings(user_id);

-- RLS: listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Tenants (and anonymous) can read active listings
CREATE POLICY "Anyone can read active listings"
  ON public.listings FOR SELECT
  USING (
    status = 'active' AND moderation_status = 'approved'
    OR auth.uid() = landlord_user_id
    OR auth.uid() = agent_user_id
    OR EXISTS (
      SELECT 1 FROM public.agency_staff
      WHERE agency_id = listings.agency_id AND user_id = auth.uid()
    )
  );

-- Landlords can create/update their own listings
CREATE POLICY "Landlords can manage own listings"
  ON public.listings FOR ALL
  USING (landlord_user_id = auth.uid())
  WITH CHECK (landlord_user_id = auth.uid());

-- Agents can manage listings assigned to them
CREATE POLICY "Agents can manage assigned listings"
  ON public.listings FOR ALL
  USING (agent_user_id = auth.uid())
  WITH CHECK (agent_user_id = auth.uid());

-- Agency admins/listing managers can manage agency listings
CREATE POLICY "Agency staff can manage agency listings"
  ON public.listings FOR ALL
  USING (
    agency_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.agency_staff
      WHERE agency_id = listings.agency_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.agency_staff
      WHERE agency_id = listings.agency_id AND user_id = auth.uid()
    )
  );

-- RLS: listing_media
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing media readable with listing"
  ON public.listing_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_media.listing_id
        AND (l.status = 'active' AND l.moderation_status = 'approved'
             OR l.landlord_user_id = auth.uid()
             OR l.agent_user_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.agency_staff s WHERE s.agency_id = l.agency_id AND s.user_id = auth.uid()))
    )
  );

CREATE POLICY "Listing owners can manage media"
  ON public.listing_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_media.listing_id
        AND (l.landlord_user_id = auth.uid()
             OR l.agent_user_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.agency_staff s WHERE s.agency_id = l.agency_id AND s.user_id = auth.uid()))
    )
  );

-- RLS: saved_listings
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved listings"
  ON public.saved_listings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
