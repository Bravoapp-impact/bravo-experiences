-- Step 1: Drop the HR policy that references company_service_config
DROP POLICY IF EXISTS "HR admin can view published public experiences v2" ON public.experiences;

-- Step 2: Recreate without company_service_config join
CREATE POLICY "HR admin can view published public experiences v3"
ON public.experiences
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'hr_admin'::app_role)
  AND status = 'published'
  AND visibility = 'public'
);

-- Step 3: Drop company_service_config RLS policies
DROP POLICY IF EXISTS "HR admin can view own company service config" ON public.company_service_config;
DROP POLICY IF EXISTS "Super admin full access on company_service_config" ON public.company_service_config;

-- Step 4: Drop the trigger if exists
DROP TRIGGER IF EXISTS update_company_service_config_updated_at ON public.company_service_config;

-- Step 5: Drop the table
DROP TABLE IF EXISTS public.company_service_config;