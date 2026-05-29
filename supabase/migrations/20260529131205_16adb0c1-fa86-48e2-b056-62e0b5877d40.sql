CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_requested_role text;
  v_role text;
  v_company_id uuid;
  v_association_id uuid;
  v_gender text;
  v_email_domain text;
BEGIN
  v_requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');

  IF v_requested_role IN ('employee', 'hr_admin', 'association_admin') THEN
    v_role := v_requested_role;
  ELSE
    v_role := 'employee';
  END IF;

  v_gender := NULLIF(NEW.raw_user_meta_data->>'gender', '');

  BEGIN
    v_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_company_id := NULL;
  END;

  BEGIN
    v_association_id := (NEW.raw_user_meta_data->>'association_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_association_id := NULL;
  END;

  -- Domain-based company resolution (employee signup without access code)
  IF v_company_id IS NULL AND v_association_id IS NULL AND v_role = 'employee' AND NEW.email IS NOT NULL THEN
    v_email_domain := lower(split_part(NEW.email, '@', 2));
    IF v_email_domain <> '' THEN
      BEGIN
        SELECT c.id INTO v_company_id
          FROM public.companies c
         WHERE EXISTS (
           SELECT 1
             FROM unnest(c.allowed_email_domains) d
            WHERE lower(d) = v_email_domain
         )
         LIMIT 1;
      EXCEPTION WHEN OTHERS THEN
        v_company_id := NULL;
      END;
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role, company_id, association_id, gender)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      v_role,
      v_company_id,
      v_association_id,
      v_gender
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: FK insert failed for user %, retrying without FKs. Error: %', NEW.id, SQLERRM;
    INSERT INTO public.profiles (id, email, first_name, last_name, role, company_id, association_id, gender)
    VALUES (
      NEW.id, NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      v_role, NULL, NULL, v_gender
    )
    ON CONFLICT (id) DO NOTHING;
  END;

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::app_role)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: user_roles insert failed for user %. Error: %', NEW.id, SQLERRM;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee'::app_role)
    ON CONFLICT DO NOTHING;
  END;

  BEGIN
    INSERT INTO public.user_tenants (user_id, company_id, association_id)
    VALUES (NEW.id, v_company_id, v_association_id)
    ON CONFLICT (user_id)
    DO UPDATE SET
      company_id = EXCLUDED.company_id,
      association_id = EXCLUDED.association_id,
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: user_tenants insert failed for user %. Error: %', NEW.id, SQLERRM;
    INSERT INTO public.user_tenants (user_id, company_id, association_id)
    VALUES (NEW.id, NULL, NULL)
    ON CONFLICT (user_id) DO NOTHING;
  END;

  RETURN NEW;
END;
$function$;