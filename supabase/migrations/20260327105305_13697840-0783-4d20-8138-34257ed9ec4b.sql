CREATE POLICY "hr_view_experience_dates_v2"
ON public.experience_dates
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'hr_admin'::app_role)
  AND (
    EXISTS (
      SELECT 1
      FROM experiences e
      JOIN company_service_config csc
        ON csc.company_id = get_user_company_id(auth.uid())
        AND csc.service_type = e.type
        AND csc.enabled = true
      WHERE e.id = experience_dates.experience_id
        AND e.status = 'published'
        AND e.visibility = 'public'
    )
    OR
    EXISTS (
      SELECT 1
      FROM bookings b
      JOIN profiles p ON p.id = b.user_id
      WHERE b.experience_date_id = experience_dates.id
        AND p.company_id = get_user_company_id(auth.uid())
        AND b.status IN ('confirmed', 'completed', 'verified')
    )
  )
);