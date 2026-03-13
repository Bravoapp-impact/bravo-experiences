
-- Add default_hours and max_participants to experiences
ALTER TABLE public.experiences 
  ADD COLUMN IF NOT EXISTS default_hours numeric,
  ADD COLUMN IF NOT EXISTS max_participants integer;

-- Allow association admins to upload experience images
CREATE POLICY "Association admins can upload experience images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'experience-images' 
  AND is_association_admin(auth.uid())
);

-- Allow association admins to manage (update/delete) their uploaded images
CREATE POLICY "Association admins can manage experience images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'experience-images' 
  AND is_association_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'experience-images' 
  AND is_association_admin(auth.uid())
);

CREATE POLICY "Association admins can delete experience images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'experience-images' 
  AND is_association_admin(auth.uid())
);
