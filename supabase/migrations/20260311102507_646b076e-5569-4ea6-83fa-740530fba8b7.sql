
-- Sprint 1: Additive columns on existing tables
-- ROLLBACK: ALTER TABLE experiences DROP COLUMN type, DROP COLUMN price_per_participant, DROP COLUMN visibility, DROP COLUMN created_by;
--           ALTER TABLE bookings DROP COLUMN verified_at, DROP COLUMN verification_method, DROP COLUMN verification_data;
--           ALTER TABLE profiles DROP COLUMN manager_id;
--           ALTER TABLE companies DROP COLUMN max_concurrent_absences;

-- experiences: type, price, visibility, created_by
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'volunteering',
  ADD COLUMN IF NOT EXISTS price_per_participant DECIMAL NULL,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS created_by UUID NULL;

-- bookings: verification fields for future attendance tracking
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS verification_method TEXT NULL,
  ADD COLUMN IF NOT EXISTS verification_data JSONB NULL;

-- profiles: manager reference
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manager_id UUID NULL REFERENCES public.profiles(id);

-- companies: concurrent absence cap
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS max_concurrent_absences INTEGER NULL;

-- Sprint 2: New tables

-- company_service_config: which services each company has enabled
CREATE TABLE IF NOT EXISTS public.company_service_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL DEFAULT 'volunteering',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, service_type)
);

ALTER TABLE public.company_service_config ENABLE ROW LEVEL SECURITY;

-- RLS: HR admin can view/update own company config
CREATE POLICY "HR admin can view own company service config"
  ON public.company_service_config FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Super admin full access on company_service_config"
  ON public.company_service_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- hour_budgets: annual hour budget per company
CREATE TABLE IF NOT EXISTS public.hour_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  hours_per_employee_year DECIMAL NOT NULL DEFAULT 0,
  fiscal_year_start DATE NOT NULL DEFAULT '2025-01-01',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, fiscal_year_start)
);

ALTER TABLE public.hour_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR admin can view own company hour budgets"
  ON public.hour_budgets FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Employees can view own company hour budgets"
  ON public.hour_budgets FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Super admin full access on hour_budgets"
  ON public.hour_budgets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- updated_at triggers
CREATE TRIGGER update_company_service_config_updated_at
  BEFORE UPDATE ON public.company_service_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hour_budgets_updated_at
  BEFORE UPDATE ON public.hour_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
