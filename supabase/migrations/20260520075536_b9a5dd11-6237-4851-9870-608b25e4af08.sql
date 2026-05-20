-- Step 1: trigger function + trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_self_tenancy_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() = NEW.id
     AND NOT public.has_role(auth.uid(), 'super_admin'::public.app_role)
  THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.association_id IS DISTINCT FROM OLD.association_id
    THEN
      RAISE EXCEPTION 'Cannot change role/company_id/association_id on own profile';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_self_tenancy_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS prevent_profile_self_tenancy_change_trg ON public.profiles;
CREATE TRIGGER prevent_profile_self_tenancy_change_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_self_tenancy_change();

-- Step 2: nuova policy con nome diverso (coesiste con la vecchia)
CREATE POLICY "Users can update own profile v2"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 3: drop policy vecchia ricorsiva
DROP POLICY IF EXISTS "Users can update own profile (no role/tenancy)" ON public.profiles;