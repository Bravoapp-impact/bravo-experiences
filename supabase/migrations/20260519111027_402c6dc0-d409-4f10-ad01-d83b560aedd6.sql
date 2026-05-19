CREATE POLICY "Employees view approved company photos for visible gallery"
ON public.gallery_photos
FOR SELECT TO authenticated
USING (
  status = 'approved'
  AND company_id = public.get_user_company_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = gallery_photos.company_id
      AND c.gallery_visible_to_employees = true
  )
);

UPDATE public.companies SET gallery_visible_to_employees = true WHERE gallery_visible_to_employees = false;