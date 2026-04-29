
-- ============================================================
-- BLOCCO 1 — RPC SECURITY DEFINER per HR
-- ============================================================

-- 1a. Lettura quote attiva per HR
CREATE OR REPLACE FUNCTION public.get_tb_quote_for_hr(p_request_id uuid)
RETURNS TABLE (
  id uuid,
  request_id uuid,
  version integer,
  status text,
  total_amount_final numeric,
  currency text,
  valid_until date,
  terms_text text,
  client_decision_notes text,
  sent_at timestamptz,
  viewed_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM tb_requests r
    WHERE r.id = p_request_id
      AND r.company_id = get_user_company_id(auth.uid())
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.request_id,
    q.version,
    q.status,
    q.total_amount_final,
    'EUR'::text AS currency,
    q.valid_until,
    q.terms_text,
    q.client_decision_notes,
    q.sent_at,
    q.viewed_at,
    q.decided_at,
    q.created_at,
    q.updated_at
  FROM tb_quotes q
  WHERE q.request_id = p_request_id
    AND q.status NOT IN ('draft', 'superseded')
  ORDER BY q.version DESC
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tb_quote_for_hr(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_tb_quote_for_hr(uuid) TO authenticated;

-- 1b. Lettura items per HR
CREATE OR REPLACE FUNCTION public.get_tb_quote_items_for_hr(p_quote_id uuid)
RETURNS TABLE (
  id uuid,
  quote_id uuid,
  description text,
  quantity numeric,
  unit_price_final numeric,
  total_final numeric,
  notes text,
  display_order integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM tb_quotes q
    JOIN tb_requests r ON r.id = q.request_id
    WHERE q.id = p_quote_id
      AND r.company_id = get_user_company_id(auth.uid())
      AND q.status NOT IN ('draft', 'superseded')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.quote_id,
    i.description,
    i.quantity,
    i.unit_price_final,
    i.total_final,
    i.notes,
    i.display_order
  FROM tb_quote_items i
  WHERE i.quote_id = p_quote_id
  ORDER BY i.display_order ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tb_quote_items_for_hr(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_tb_quote_items_for_hr(uuid) TO authenticated;

-- 1c. Decisione HR su quote
CREATE OR REPLACE FUNCTION public.hr_decide_on_quote(
  p_quote_id uuid,
  p_decision text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_request_id uuid;
  v_status text;
  v_new_quote_status text;
  v_new_request_status text;
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT q.request_id, q.status
    INTO v_request_id, v_status
  FROM tb_quotes q
  JOIN tb_requests r ON r.id = q.request_id
  WHERE q.id = p_quote_id
    AND r.company_id = get_user_company_id(auth.uid());

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_status NOT IN ('sent', 'viewed') THEN
    RAISE EXCEPTION 'bad_state: quote is %', v_status;
  END IF;

  IF p_decision = 'accepted' THEN
    v_new_quote_status := 'accepted';
    v_new_request_status := 'quote_accepted';
  ELSIF p_decision = 'rejected' THEN
    v_new_quote_status := 'rejected';
    v_new_request_status := 'quote_rejected';
  ELSIF p_decision = 'modification_requested' THEN
    IF p_notes IS NULL OR length(btrim(p_notes)) = 0 THEN
      RAISE EXCEPTION 'missing_notes';
    END IF;
    v_new_quote_status := 'modification_requested';
    v_new_request_status := 'quote_in_composition';
  ELSE
    RAISE EXCEPTION 'bad_decision: %', p_decision;
  END IF;

  UPDATE tb_quotes
  SET status = v_new_quote_status,
      decided_at = now(),
      client_decision_notes = COALESCE(p_notes, client_decision_notes),
      updated_at = now()
  WHERE id = p_quote_id;

  UPDATE tb_requests
  SET status = v_new_request_status,
      updated_at = now()
  WHERE id = v_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.hr_decide_on_quote(uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.hr_decide_on_quote(uuid, text, text) TO authenticated;

-- ============================================================
-- BLOCCO 2 — Policy SELECT più restrittive
-- ============================================================

DROP POLICY IF EXISTS "HR can view quotes for own requests" ON public.tb_quotes;
CREATE POLICY "HR can view non-draft quotes for own requests"
  ON public.tb_quotes
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'hr_admin'::app_role)
    AND status NOT IN ('draft', 'superseded')
    AND EXISTS (
      SELECT 1 FROM tb_requests r
      WHERE r.id = tb_quotes.request_id
        AND r.company_id = get_user_company_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "HR can view quote items for own requests" ON public.tb_quote_items;
CREATE POLICY "HR can view items of non-draft quotes for own requests"
  ON public.tb_quote_items
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM tb_quotes q
      JOIN tb_requests r ON r.id = q.request_id
      WHERE q.id = tb_quote_items.quote_id
        AND r.company_id = get_user_company_id(auth.uid())
        AND q.status NOT IN ('draft', 'superseded')
    )
  );

-- ============================================================
-- BLOCCO 3 — REVOKE colonne sensibili al ruolo authenticated
-- ============================================================
-- Nota: le RPC del Blocco 1 girano come owner (postgres) e quindi
-- possono comunque leggere queste colonne quando servono internamente.

REVOKE SELECT (total_amount_ets, bravo_margin_amount, bravo_margin_percent)
  ON public.tb_quotes FROM authenticated;

REVOKE SELECT (unit_price_ets, total_ets, association_id, proposal_id)
  ON public.tb_quote_items FROM authenticated;

-- ============================================================
-- BLOCCO 4 — Rimozione policy UPDATE HR su tb_quotes
-- ============================================================
-- Da qui in poi l'HR può cambiare lo stato del preventivo SOLO
-- via la RPC hr_decide_on_quote.

DROP POLICY IF EXISTS "HR can update quotes for own requests" ON public.tb_quotes;
