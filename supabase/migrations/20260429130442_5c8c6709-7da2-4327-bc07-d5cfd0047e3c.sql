-- =====================================================================
-- TB REQUEST STATUS LOG — migration
-- =====================================================================
-- ORDINE DI ESECUZIONE OBBLIGATORIO (NON RIORDINARE):
--   1.1  Tabella tb_request_status_log + indici + RLS
--   1.2  Trigger function + trigger AFTER INSERT/UPDATE su tb_requests
--   1.3  Backfill (in transazione con LOCK su tb_requests)
--   1.4  RPC get_tb_request_status_log_for_admin
--   1.5  Scalar function get_tb_request_current_status_since
--          + view tb_requests_with_status_since
--
-- MOTIVO: il trigger (1.2) deve esistere PRIMA del backfill (1.3).
-- Se il backfill girasse prima del trigger, ogni nuova request creata
-- nella finestra [backfill, trigger] non sarebbe loggata e produrrebbe
-- cronologia incompleta.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1.1  Tabella + indici + RLS
-- ---------------------------------------------------------------------
CREATE TABLE public.tb_request_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tb_requests(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid,
  note text
);

CREATE INDEX idx_tb_request_status_log_request_id
  ON public.tb_request_status_log(request_id);

CREATE INDEX idx_tb_request_status_log_changed_at
  ON public.tb_request_status_log(changed_at DESC);

ALTER TABLE public.tb_request_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin select tb_request_status_log"
  ON public.tb_request_status_log FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin insert tb_request_status_log"
  ON public.tb_request_status_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "HR select own company tb_request_status_log"
  ON public.tb_request_status_log FOR SELECT
  USING (
    has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_requests r
      WHERE r.id = tb_request_status_log.request_id
        AND r.company_id = get_user_company_id(auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 1.2  Trigger function + trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_tb_request_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.tb_request_status_log (request_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.tb_request_status_log (request_id, from_status, to_status, changed_by)
      VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tb_request_status_log_insert
  AFTER INSERT ON public.tb_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_tb_request_status_change();

CREATE TRIGGER trg_tb_request_status_log_update
  AFTER UPDATE OF status ON public.tb_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_tb_request_status_change();

-- ---------------------------------------------------------------------
-- 1.3  Backfill (in transazione con LOCK su tb_requests)
-- ---------------------------------------------------------------------
-- LOCK SHARE MODE: blocca UPDATE concorrenti su tb_requests durante il
-- backfill ma permette altre SELECT. Per le ~poche righe esistenti il
-- costo è trascurabile.
LOCK TABLE public.tb_requests IN SHARE MODE;

INSERT INTO public.tb_request_status_log (request_id, from_status, to_status, changed_at, changed_by)
SELECT r.id, NULL, r.status, r.created_at, NULL
FROM public.tb_requests r
WHERE NOT EXISTS (
  SELECT 1 FROM public.tb_request_status_log l WHERE l.request_id = r.id
);

-- ---------------------------------------------------------------------
-- 1.4  RPC get_tb_request_status_log_for_admin
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_tb_request_status_log_for_admin(p_request_id uuid)
RETURNS TABLE (
  id uuid,
  from_status text,
  to_status text,
  changed_at timestamptz,
  changed_by uuid,
  changed_by_name text,
  note text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.from_status,
    l.to_status,
    l.changed_at,
    l.changed_by,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
      p.email
    ) AS changed_by_name,
    l.note
  FROM public.tb_request_status_log l
  LEFT JOIN public.profiles p ON p.id = l.changed_by
  WHERE l.request_id = p_request_id
  ORDER BY l.changed_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tb_request_status_log_for_admin(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_tb_request_status_log_for_admin(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 1.5  Scalar function + view
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_tb_request_current_status_since(p_request_id uuid)
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- TODO scaling: se tb_request_status_log supera ~10k righe per request,
  -- valutare denormalizzazione su tb_requests.status_since aggiornata da trigger.
  SELECT MAX(changed_at) FROM public.tb_request_status_log WHERE request_id = p_request_id;
$$;

-- VIEW dedicata per la case list super-admin.
-- security_invoker=on → eredita le RLS di tb_requests
-- (pattern già usato in associations_public).
CREATE OR REPLACE VIEW public.tb_requests_with_status_since
WITH (security_invoker=on) AS
SELECT
  r.*,
  public.get_tb_request_current_status_since(r.id) AS status_since
FROM public.tb_requests r;

GRANT SELECT ON public.tb_requests_with_status_since TO authenticated;