-- Grant read access for anon/authenticated on tables used by tenant discover
-- Fixes 42501 "permission denied" when client queries via PostgREST

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.listings TO anon, authenticated;
GRANT SELECT ON public.listing_media TO anon, authenticated;
