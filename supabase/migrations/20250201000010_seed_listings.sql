-- Seed sample Bahrain listings for development
-- Uses first profile as rental manager. Run after you have at least one user.

DO $$
DECLARE
  manager_id UUID;
BEGIN
  SELECT user_id INTO manager_id FROM public.profiles LIMIT 1;
  IF manager_id IS NULL THEN
    RAISE NOTICE 'No profiles found. Create a user first, then run this seed.';
    RETURN;
  END IF;

  INSERT INTO public.listings (
    manager_user_id, listing_for, status, moderation_status, publish_at, renew_by,
    property_type, title, description, price_monthly, security_deposit, beds, baths, area_sqm,
    city, area, furnished_type, utilities_included, ac_type, pets_policy, amenities,
    is_uni_hub, is_premium
  )
  VALUES
    (manager_id, 'own_property', 'active', 'approved', now(), now() + interval '30 days',
     'apartment', 'Sea View Apartment, Juffair',
     'Spacious 2BR with balcony overlooking the Gulf. Fully furnished, modern kitchen, gym access.',
     650, 650, 2, 2, 95, 'Manama', 'Juffair',
     'furnished', true, 'central_ac', 'no_pets',
     ARRAY['balcony', 'shared_gym', 'shared_pool', 'covered_parking', 'sea_view'],
     false, true),

    (manager_id, 'own_property', 'active', 'approved', now(), now() + interval '30 days',
     'apartment', 'Student-Friendly Room, Saar',
     'Private room in shared villa. Walking distance to BIBF. Ideal for students. Bills included.',
     280, 280, 1, 1, 25, 'Northern', 'Saar',
     'furnished', true, 'mounted_ac', 'no_pets',
     ARRAY['built_in_wardrobe'],
     true, false),

    (manager_id, 'own_property', 'active', 'approved', now(), now() + interval '30 days',
     'villa', 'Villa in Amwaj Islands',
     '3BR villa with private pool. Gated community, beach access, parking.',
     1200, 1200, 3, 4, 220, 'Muharraq', 'Amwaj Islands',
     'furnished', false, 'central_ac', 'dogs_and_cats',
     ARRAY['private_pool', 'gated_compound', 'covered_parking', 'sea_view', 'balcony', 'bbq_grill'],
     false, true),

    (manager_id, 'own_property', 'active', 'approved', now(), now() + interval '30 days',
     'apartment', 'Studio Near Bahrain Bay',
     'Compact studio for professionals. Bay views, concierge, 5 min to Bahrain Bay.',
     450, 450, 0, 1, 45, 'Manama', 'Bahrain Bay',
     'furnished', true, 'central_ac', 'no_pets',
     ARRAY['concierge_service', 'shared_gym', 'view_of_landmark'],
     false, false),

    (manager_id, 'own_property', 'active', 'approved', now(), now() + interval '30 days',
     'villa', 'Family Villa, Hamala',
     '4BR villa with garden. Quiet neighborhood, near schools. Pet-friendly.',
     900, 900, 4, 3, 280, 'Northern', 'Hamala',
     'semi_furnished', false, 'central_ac', 'dogs_and_cats',
     ARRAY['maids_room', 'covered_parking', 'gated_compound', 'built_in_wardrobe'],
     false, false),

    (manager_id, 'own_property', 'active', 'approved', now(), now() + interval '30 days',
     'apartment', 'Uni Hub Shared Apartment',
     'Room in 4BR apartment. Other tenants are students. Central Manama location.',
     320, 320, 1, 1, 30, 'Manama', 'Gudaibiya',
     'furnished', true, 'mounted_ac', 'no_pets',
     ARRAY['built_in_washer'],
     true, false),

    (manager_id, 'own_property', 'active', 'approved', now(), now() + interval '30 days',
     'penthouse', 'Luxury Penthouse, Seef',
     'Top floor 2BR with panoramic views. Marble finishes, smart home. Available March.',
     1800, 2700, 2, 3, 150, 'Manama', 'Seef',
     'furnished', true, 'central_ac', 'cats_allowed',
     ARRAY['concierge_service', 'private_gym', 'private_pool', 'balcony', 'sea_view', 'walk_in_closet', 'jacuzzi', 'roof_access'],
     false, true);
END $$;

-- Add placeholder images for each listing
INSERT INTO public.listing_media (listing_id, type, external_url, order_index)
SELECT l.id, 'photo'::public.listing_media_type, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 0
FROM public.listings l
WHERE l.status = 'active' AND l.moderation_status = 'approved'
  AND NOT EXISTS (SELECT 1 FROM public.listing_media m WHERE m.listing_id = l.id);
