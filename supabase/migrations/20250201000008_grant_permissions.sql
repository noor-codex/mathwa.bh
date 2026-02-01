-- Grant read access for anon/authenticated on tables used by tenant discover
-- Supabase client uses these roles; without GRANT, RLS blocks even permitted rows

GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.listings TO authenticated;

GRANT SELECT ON public.listing_media TO anon;
GRANT SELECT ON public.listing_media TO authenticated;
