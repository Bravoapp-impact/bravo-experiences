CREATE OR REPLACE FUNCTION public.can_employee_see_experience(p_user_id uuid, p_experience_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $function$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT ut.company_id INTO v_company_id
  FROM user_tenants ut WHERE ut.user_id = p_user_id;
  IF v_company_id IS NULL THEN RETURN false; END IF;

  RETURN EXISTS (
    SELECT 1 FROM experience_companies ec
    WHERE ec.experience_id = p_experience_id
      AND ec.company_id = v_company_id
  );
END;
$function$;