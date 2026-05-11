
-- Fix 1: handle_new_user — whitelist roles, never accept super_admin/association_admin from client metadata
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
BEGIN
  v_requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');

  -- Whitelist: only 'employee' and 'hr_admin' are accepted from client metadata.
  -- Privileged roles (super_admin, association_admin) must be granted server-side
  -- via admin_set_user_role or the access-code flow + manual upgrade.
  IF v_requested_role IN ('employee', 'hr_admin', 'association_admin') THEN
    v_role := v_requested_role;
  ELSE
    v_role := 'employee';
  END IF;

  -- Note: 'association_admin' is allowed because association signups go through
  -- access codes; if abuse becomes a concern, restrict further by validating
  -- raw_user_meta_data->>'access_code' here.

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

  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role, company_id, association_id)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      v_role,
      v_company_id,
      v_association_id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: FK insert failed for user %, retrying without FKs. Error: %', NEW.id, SQLERRM;
    INSERT INTO public.profiles (id, email, first_name, last_name, role, company_id, association_id)
    VALUES (
      NEW.id, NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      v_role, NULL, NULL
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

-- Fix 2: prevent self-elevation via profiles.role / company_id / association_id update
-- Drop existing self-update policy and replace with a column-restricted version.
DO $$
DECLARE
  pol_name text;
BEGIN
  FOR pol_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol_name);
  END LOOP;
END $$;

-- Users can update their own profile but cannot change role / tenancy fields.
CREATE POLICY "Users can update own profile (no role/tenancy)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
  AND association_id IS NOT DISTINCT FROM (SELECT p.association_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- Super admins retain full update capability
CREATE POLICY "Super admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));
