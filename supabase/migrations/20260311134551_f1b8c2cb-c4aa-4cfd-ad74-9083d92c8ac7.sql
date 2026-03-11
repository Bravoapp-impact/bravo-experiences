
-- Helper: compute the start of the current fiscal year given a fiscal_year_start date
CREATE OR REPLACE FUNCTION public.make_current_fiscal_year_start(p_fiscal_start date)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_month int := EXTRACT(MONTH FROM p_fiscal_start);
  v_day int := EXTRACT(DAY FROM p_fiscal_start);
  v_current_year int := EXTRACT(YEAR FROM now());
  v_candidate date;
BEGIN
  v_candidate := make_date(v_current_year, v_month, v_day);
  IF v_candidate > CURRENT_DATE THEN
    v_candidate := make_date(v_current_year - 1, v_month, v_day);
  END IF;
  RETURN v_candidate::timestamptz;
END;
$$;

-- Main function: check if a user can book within their hour budget
CREATE OR REPLACE FUNCTION public.check_hour_budget(p_user_id uuid, p_experience_date_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
DECLARE
  v_company_id uuid;
  v_budget_hours numeric;
  v_fiscal_start date;
  v_used_hours numeric;
  v_new_hours numeric;
  v_fiscal_year_start timestamptz;
  v_fiscal_year_end timestamptz;
BEGIN
  -- Get user's company
  SELECT ut.company_id INTO v_company_id
  FROM public.user_tenants ut WHERE ut.user_id = p_user_id;

  IF v_company_id IS NULL THEN RETURN true; END IF;

  -- Get budget config (most recent for this company)
  SELECT hb.hours_per_employee_year, hb.fiscal_year_start
  INTO v_budget_hours, v_fiscal_start
  FROM public.hour_budgets hb
  WHERE hb.company_id = v_company_id
  ORDER BY hb.created_at DESC LIMIT 1;

  -- No budget configured or zero = unlimited
  IF v_budget_hours IS NULL OR v_budget_hours <= 0 THEN RETURN true; END IF;

  -- Calculate fiscal year range
  v_fiscal_year_start := make_current_fiscal_year_start(v_fiscal_start);
  v_fiscal_year_end := v_fiscal_year_start + interval '1 year';

  -- Get hours of the new experience date
  SELECT COALESCE(ed.volunteer_hours, 0) INTO v_new_hours
  FROM public.experience_dates ed WHERE ed.id = p_experience_date_id;

  IF v_new_hours IS NULL THEN v_new_hours := 0; END IF;

  -- Sum hours already booked in the fiscal year
  SELECT COALESCE(SUM(ed.volunteer_hours), 0) INTO v_used_hours
  FROM public.bookings b
  JOIN public.experience_dates ed ON b.experience_date_id = ed.id
  WHERE b.user_id = p_user_id
    AND b.status IN ('confirmed', 'completed')
    AND ed.start_datetime >= v_fiscal_year_start
    AND ed.start_datetime < v_fiscal_year_end;

  RETURN (v_used_hours + v_new_hours) <= v_budget_hours;
END;
$$;

-- Drop existing INSERT policy on bookings
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

-- Recreate with hour budget check
CREATE POLICY "Users can create bookings" ON public.bookings
FOR INSERT TO public
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
      AND ed.company_id = get_user_company_id(auth.uid())
  ))
);
