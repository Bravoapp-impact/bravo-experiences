
-- 1. Fix swapped arguments in bookings INSERT policy
DROP POLICY IF EXISTS "users_create_bookings_v2" ON public.bookings;

CREATE POLICY "users_create_bookings_v3"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  AND is_experience_date_available(experience_date_id)
  AND check_hour_budget(auth.uid(), experience_date_id)
  AND (EXISTS (
    SELECT 1
    FROM experience_dates ed
    JOIN experiences e ON ed.experience_id = e.id
    WHERE ed.id = bookings.experience_date_id
      AND e.status = 'published'
      AND can_employee_see_experience(auth.uid(), e.id)
  ))
);

-- 2. Restrict associations SELECT for non-admin authenticated users
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view associations" ON public.associations;

-- Replace with a policy that only shows non-sensitive columns via the existing view
-- Regular authenticated users should use the associations_public view instead
-- Keep existing admin/association-admin policies which already exist

-- 3. Fix experience-images storage policies with ownership checks
-- Drop existing permissive policies for association admins
DROP POLICY IF EXISTS "Association admins can upload experience images" ON storage.objects;
DROP POLICY IF EXISTS "Association admins can update experience images" ON storage.objects;
DROP POLICY IF EXISTS "Association admins can delete experience images" ON storage.objects;

-- Recreate with path-based ownership
CREATE POLICY "Association admins can upload experience images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'experience-images'
  AND is_association_admin(auth.uid())
  AND (storage.foldername(name))[1] = get_user_association_id(auth.uid())::text
);

CREATE POLICY "Association admins can update experience images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'experience-images'
  AND is_association_admin(auth.uid())
  AND (storage.foldername(name))[1] = get_user_association_id(auth.uid())::text
);

CREATE POLICY "Association admins can delete experience images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'experience-images'
  AND is_association_admin(auth.uid())
  AND (storage.foldername(name))[1] = get_user_association_id(auth.uid())::text
);
