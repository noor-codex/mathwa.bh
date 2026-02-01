-- Fix infinite recursion in agency_staff RLS policies
-- Use SECURITY DEFINER functions to check membership without triggering RLS

CREATE OR REPLACE FUNCTION public.is_agency_admin_or_manager(p_agency_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_staff
    WHERE agency_id = p_agency_id
      AND user_id = p_user_id
      AND role IN ('admin', 'listing_manager')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_agency_admin(p_agency_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_staff
    WHERE agency_id = p_agency_id AND user_id = p_user_id AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Drop and recreate agency_staff policies to use the helper functions
DROP POLICY IF EXISTS "Users can read agency_staff for agencies they belong to" ON public.agency_staff;
DROP POLICY IF EXISTS "Agency admins can manage staff" ON public.agency_staff;
DROP POLICY IF EXISTS "Primary contact can add themselves as first staff" ON public.agency_staff;

CREATE POLICY "Users can read agency_staff for agencies they belong to"
  ON public.agency_staff FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_agency_admin_or_manager(agency_id, auth.uid())
  );

CREATE POLICY "Primary contact can add themselves as first staff"
  ON public.agency_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agencies a
      WHERE a.id = agency_staff.agency_id AND a.primary_contact_user_id = auth.uid()
    )
  );

CREATE POLICY "Agency admins can manage staff"
  ON public.agency_staff FOR ALL
  USING (public.is_agency_admin(agency_id, auth.uid()));
