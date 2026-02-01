-- Seed sample Bahrain listings for development
-- Uses first profile as landlord. Run after you have at least one user.

DO $$
DECLARE
  landlord_id UUID;
BEGIN
  SELECT user_id INTO landlord_id FROM public.profiles LIMIT 1;
  IF landlord_id IS NULL THEN
    RAISE NOTICE 'No profiles found. Create a user first, then run this seed.';
    RETURN;
  END IF;

  INSERT INTO public.listings (
    owner_type, landlord_user_id, status, moderation_status, publish_at, renew_by,
    title, description, price_monthly, beds, baths, area_sqm, city, area, is_uni_hub, is_featured
  )
  VALUES
    ('landlord', landlord_id, 'active', 'approved', now(), now() + interval '30 days', 'Sea View Apartment, Juffair', 'Spacious 2BR with balcony overlooking the Gulf. Fully furnished, modern kitchen, gym access.', 650, 2, 2, 95, 'Manama', 'Juffair', false, true),
    ('landlord', landlord_id, 'active', 'approved', now(), now() + interval '30 days', 'Student-Friendly Room, Saar', 'Private room in shared villa. Walking distance to BIBF. Ideal for students. Bills included.', 280, 1, 1, 25, 'Northern', 'Saar', true, false),
    ('landlord', landlord_id, 'active', 'approved', now(), now() + interval '30 days', 'Villa in Amwaj Islands', '3BR villa with private pool. Gated community, beach access, parking.', 1200, 3, 4, 220, 'Muharraq', 'Amwaj Islands', false, true),
    ('landlord', landlord_id, 'active', 'approved', now(), now() + interval '30 days', 'Studio Near Bahrain Bay', 'Compact studio for professionals. Bay views, concierge, 5 min to Bahrain Bay.', 450, 1, 1, 45, 'Manama', 'Bahrain Bay', false, false),
    ('landlord', landlord_id, 'active', 'approved', now(), now() + interval '30 days', 'Family Villa, Hamala', '4BR villa with garden. Quiet neighborhood, near schools. Pet-friendly.', 900, 4, 3, 280, 'Northern', 'Hamala', false, false),
    ('landlord', landlord_id, 'active', 'approved', now(), now() + interval '30 days', 'Uni Hub Shared Apartment', 'Room in 4BR apartment. Other tenants are students. Central Manama location.', 320, 1, 1, 30, 'Manama', 'Gudaibiya', true, false),
    ('landlord', landlord_id, 'active', 'approved', now(), now() + interval '30 days', 'Luxury Penthouse, Seef', 'Top floor 2BR with panoramic views. Marble finishes, smart home. Available March.', 1800, 2, 3, 150, 'Manama', 'Seef', false, true);
END $$;

-- Add placeholder images for each listing
INSERT INTO public.listing_media (listing_id, type, external_url, order_index)
SELECT l.id, 'photo'::public.listing_media_type, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 0
FROM public.listings l
WHERE l.status = 'active' AND l.moderation_status = 'approved'
  AND NOT EXISTS (SELECT 1 FROM public.listing_media m WHERE m.listing_id = l.id);
