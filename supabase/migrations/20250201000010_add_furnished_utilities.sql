-- Add furnished_type and utilities_included to listings for Discover UI

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS furnished_type TEXT
    CHECK (furnished_type IS NULL OR furnished_type IN ('furnished', 'semi_furnished', 'not_furnished')),
  ADD COLUMN IF NOT EXISTS utilities_included BOOLEAN;

COMMENT ON COLUMN public.listings.furnished_type IS 'furnished | semi_furnished | not_furnished';
COMMENT ON COLUMN public.listings.utilities_included IS 'true = inclusive, false = exclusive';
