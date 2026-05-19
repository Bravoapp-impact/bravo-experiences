
-- 1. Tabella association_suggestions
CREATE TABLE public.association_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  suggested_name text NOT NULL,
  suggested_city text NULL,
  suggester_name text NOT NULL,
  suggester_email text NULL,
  reason text NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz NULL,
  reviewed_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT association_suggestions_status_check CHECK (status IN ('new','seen','archived'))
);

CREATE INDEX idx_assoc_suggestions_company_status_created
  ON public.association_suggestions (company_id, status, created_at DESC);

ALTER TABLE public.association_suggestions ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "Super admin full access on association_suggestions"
ON public.association_suggestions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- HR admin: SELECT propria company
CREATE POLICY "HR can view own company association_suggestions"
ON public.association_suggestions
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'hr_admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
);

-- HR admin: UPDATE solo status/reviewed_at/reviewed_by sulla propria company.
-- Forziamo l'immutabilità degli altri campi nel WITH CHECK.
CREATE POLICY "HR can update status on own company association_suggestions"
ON public.association_suggestions
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'hr_admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'hr_admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
);

-- Trigger: blocca cambi su colonne diverse da status/reviewed_at/reviewed_by quando l'autore NON è super_admin
CREATE OR REPLACE FUNCTION public.protect_association_suggestions_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.company_id IS DISTINCT FROM OLD.company_id
     OR NEW.suggested_name IS DISTINCT FROM OLD.suggested_name
     OR NEW.suggested_city IS DISTINCT FROM OLD.suggested_city
     OR NEW.suggester_name IS DISTINCT FROM OLD.suggester_name
     OR NEW.suggester_email IS DISTINCT FROM OLD.suggester_email
     OR NEW.reason IS DISTINCT FROM OLD.reason
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.id IS DISTINCT FROM OLD.id
  THEN
    RAISE EXCEPTION 'Only status/reviewed_at/reviewed_by can be modified';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_association_suggestions_columns
BEFORE UPDATE ON public.association_suggestions
FOR EACH ROW EXECUTE FUNCTION public.protect_association_suggestions_columns();

-- 2. Colonna suggestion_token su companies (DEFAULT applicato anche alle righe esistenti)
ALTER TABLE public.companies
  ADD COLUMN suggestion_token uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.companies
  ADD CONSTRAINT companies_suggestion_token_key UNIQUE (suggestion_token);

-- 3. Policy UPDATE su companies per HR (solo per rigenerazione token via RPC)
CREATE POLICY "HR can update own company"
ON public.companies
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'hr_admin'::app_role)
  AND id = get_user_company_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'hr_admin'::app_role)
  AND id = get_user_company_id(auth.uid())
);

-- Trigger di protezione: gli HR possono modificare SOLO suggestion_token via UPDATE diretto.
-- (La RPC regenerate_suggestion_token gira con SECURITY DEFINER e bypassa questo trigger.)
CREATE OR REPLACE FUNCTION public.protect_companies_hr_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF has_role(auth.uid(), 'hr_admin'::app_role) THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.name IS DISTINCT FROM OLD.name
       OR NEW.logo_url IS DISTINCT FROM OLD.logo_url
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.max_concurrent_absences IS DISTINCT FROM OLD.max_concurrent_absences
       OR NEW.gallery_visible_to_employees IS DISTINCT FROM OLD.gallery_visible_to_employees
    THEN
      RAISE EXCEPTION 'HR can only update suggestion_token on companies';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_companies_hr_update
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.protect_companies_hr_update();

-- 4. RPC regenerate_suggestion_token
CREATE OR REPLACE FUNCTION public.regenerate_suggestion_token()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_new_token uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'super_admin must specify a company explicitly via admin RPC';
  END IF;

  IF NOT has_role(auth.uid(), 'hr_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_company_id := get_user_company_id(auth.uid());
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'no company';
  END IF;

  UPDATE public.companies
  SET suggestion_token = gen_random_uuid()
  WHERE id = v_company_id
  RETURNING suggestion_token INTO v_new_token;

  RETURN v_new_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.regenerate_suggestion_token() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_suggestion_token() TO authenticated;
