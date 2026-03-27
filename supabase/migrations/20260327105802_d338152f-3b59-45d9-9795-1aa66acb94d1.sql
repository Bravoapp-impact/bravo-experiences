-- 1) Security definer function to check historical bookings without RLS recursion
CREATE OR REPLACE FUNCTION public.hr_has_historical_booking_for_date(_user_id uuid, _date_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bookings b
    JOIN profiles p ON p.id = b.user_id
    WHERE b.experience_date_id = _date_id
      AND p.company_id = (SELECT ut.company_id FROM user_tenants ut WHERE ut.user_id = _user_id)
      AND b.status IN ('confirmed', 'completed', 'verified')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.hr_has_historical_booking_for_date FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hr_has_historical_booking_for_date TO authenticated;

-- 2) Drop recursive policy and replace with safe version
DROP POLICY IF EXISTS "hr_view_experience_dates_v2" ON public.experience_dates;

CREATE POLICY "hr_view_experience_dates_v3"
ON public.experience_dates
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'hr_admin'::app_role) AND (
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
    public.hr_has_historical_booking_for_date(auth.uid(), experience_dates.id)
  )
);