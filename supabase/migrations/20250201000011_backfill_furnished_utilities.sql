-- Backfill furnished_type and utilities_included for existing listings (sample values)

UPDATE public.listings
SET furnished_type = 'furnished', utilities_included = true
WHERE furnished_type IS NULL;
