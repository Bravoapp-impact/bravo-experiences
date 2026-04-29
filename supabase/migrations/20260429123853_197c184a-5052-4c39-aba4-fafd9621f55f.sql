-- Blocco 1
CREATE OR REPLACE FUNCTION public.get_tb_quote_full_for_admin(p_quote_id uuid)
RETURNS TABLE (
  id uuid, request_id uuid, version integer, status text,
  total_amount_final numeric, total_amount_ets numeric,
  bravo_margin_amount numeric, bravo_margin_percent numeric,
  valid_until date, terms_text text, pdf_url text,
  client_decision_notes text,
  sent_at timestamptz, viewed_at timestamptz, decided_at timestamptz,
  created_by uuid, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT q.id, q.request_id, q.version, q.status,
         q.total_amount_final, q.total_amount_ets,
         q.bravo_margin_amount, q.bravo_margin_percent,
         q.valid_until, q.terms_text, q.pdf_url,
         q.client_decision_notes,
         q.sent_at, q.viewed_at, q.decided_at,
         q.created_by, q.created_at, q.updated_at
  FROM tb_quotes q
  WHERE q.id = p_quote_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tb_quote_full_for_admin(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_tb_quote_full_for_admin(uuid) TO authenticated;

-- Blocco 2
CREATE OR REPLACE FUNCTION public.get_tb_quote_items_full_for_admin(p_quote_id uuid)
RETURNS TABLE (
  id uuid, quote_id uuid, proposal_id uuid, association_id uuid,
  description text, quantity numeric,
  unit_price_ets numeric, unit_price_final numeric,
  total_ets numeric, total_final numeric,
  notes text, display_order integer, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT i.id, i.quote_id, i.proposal_id, i.association_id,
         i.description, i.quantity,
         i.unit_price_ets, i.unit_price_final,
         i.total_ets, i.total_final,
         i.notes, i.display_order, i.created_at
  FROM tb_quote_items i
  WHERE i.quote_id = p_quote_id
  ORDER BY i.display_order ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tb_quote_items_full_for_admin(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_tb_quote_items_full_for_admin(uuid) TO authenticated;

-- Blocco 3
CREATE OR REPLACE FUNCTION public.get_tb_quote_history_for_admin(p_request_id uuid)
RETURNS TABLE (
  id uuid, version integer, status text,
  total_amount_final numeric, total_amount_ets numeric,
  sent_at timestamptz, decided_at timestamptz,
  client_decision_notes text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT q.id, q.version, q.status,
         q.total_amount_final, q.total_amount_ets,
         q.sent_at, q.decided_at, q.client_decision_notes,
         q.created_at, q.updated_at
  FROM tb_quotes q
  WHERE q.request_id = p_request_id
  ORDER BY q.version DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tb_quote_history_for_admin(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_tb_quote_history_for_admin(uuid) TO authenticated;

-- Blocco 4
CREATE OR REPLACE FUNCTION public.admin_save_tb_quote_draft(
  p_quote_id uuid,
  p_request_id uuid,
  p_total_amount_final numeric,
  p_total_amount_ets numeric,
  p_bravo_margin_amount numeric,
  p_bravo_margin_percent numeric,
  p_valid_until date,
  p_terms_text text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
DECLARE
  v_quote_id uuid;
  v_status text;
  v_item jsonb;
  v_idx int := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'validation_error: p_items must be a JSON array';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_idx := v_idx + 1;
    IF COALESCE(NULLIF(v_item->>'description',''),'') = '' THEN
      RAISE EXCEPTION 'validation_error: item % missing description', v_idx;
    END IF;
    IF COALESCE((v_item->>'quantity')::numeric, 0) <= 0 THEN
      RAISE EXCEPTION 'validation_error: item % quantity must be > 0', v_idx;
    END IF;
    IF COALESCE((v_item->>'unit_price_final')::numeric, -1) < 0 THEN
      RAISE EXCEPTION 'validation_error: item % unit_price_final must be >= 0', v_idx;
    END IF;
    IF COALESCE((v_item->>'unit_price_ets')::numeric, -1) < 0 THEN
      RAISE EXCEPTION 'validation_error: item % unit_price_ets must be >= 0', v_idx;
    END IF;
  END LOOP;

  IF COALESCE(p_total_amount_final, -1) < 0 THEN
    RAISE EXCEPTION 'validation_error: total_amount_final must be >= 0';
  END IF;

  IF p_quote_id IS NULL THEN
    IF p_request_id IS NULL THEN
      RAISE EXCEPTION 'validation_error: p_request_id required when p_quote_id is NULL';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('tb_quote_v1_' || p_request_id::text));

    IF NOT EXISTS (SELECT 1 FROM tb_requests WHERE id = p_request_id) THEN
      RAISE EXCEPTION 'request_not_found';
    END IF;

    IF EXISTS (SELECT 1 FROM tb_quotes WHERE request_id = p_request_id) THEN
      RAISE EXCEPTION 'quote_already_exists';
    END IF;

    INSERT INTO tb_quotes (
      request_id, version, status,
      total_amount_final, total_amount_ets,
      bravo_margin_amount, bravo_margin_percent,
      valid_until, terms_text, created_by
    ) VALUES (
      p_request_id, 1, 'draft',
      p_total_amount_final, p_total_amount_ets,
      p_bravo_margin_amount, p_bravo_margin_percent,
      p_valid_until, p_terms_text, auth.uid()
    )
    RETURNING id INTO v_quote_id;

  ELSE
    SELECT id, status INTO v_quote_id, v_status
    FROM tb_quotes WHERE id = p_quote_id
    FOR UPDATE;

    IF v_quote_id IS NULL THEN
      RAISE EXCEPTION 'not_found';
    END IF;

    IF v_status <> 'draft' THEN
      RAISE EXCEPTION 'bad_state: quote is %, cannot modify', v_status;
    END IF;

    UPDATE tb_quotes SET
      total_amount_final   = p_total_amount_final,
      total_amount_ets     = p_total_amount_ets,
      bravo_margin_amount  = p_bravo_margin_amount,
      bravo_margin_percent = p_bravo_margin_percent,
      valid_until          = p_valid_until,
      terms_text           = p_terms_text,
      updated_at           = now()
    WHERE id = p_quote_id;
  END IF;

  DELETE FROM tb_quote_items WHERE quote_id = v_quote_id;

  INSERT INTO tb_quote_items (
    quote_id, proposal_id, association_id,
    description, quantity,
    unit_price_ets, unit_price_final,
    total_ets, total_final,
    notes, display_order
  )
  SELECT
    v_quote_id,
    NULLIF(elem->>'proposal_id','')::uuid,
    NULLIF(elem->>'association_id','')::uuid,
    elem->>'description',
    (elem->>'quantity')::numeric,
    NULLIF(elem->>'unit_price_ets','')::numeric,
    NULLIF(elem->>'unit_price_final','')::numeric,
    NULLIF(elem->>'total_ets','')::numeric,
    NULLIF(elem->>'total_final','')::numeric,
    NULLIF(elem->>'notes',''),
    COALESCE((elem->>'display_order')::int, 0)
  FROM jsonb_array_elements(p_items) AS elem;

  RETURN v_quote_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_save_tb_quote_draft(uuid,uuid,numeric,numeric,numeric,numeric,date,text,jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_save_tb_quote_draft(uuid,uuid,numeric,numeric,numeric,numeric,date,text,jsonb) TO authenticated;

-- Blocco 5
CREATE OR REPLACE FUNCTION public.admin_send_tb_quote(p_quote_id uuid)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
DECLARE
  v_request_id uuid;
  v_status text;
  v_total numeric;
  v_items_count int;
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT request_id, status, total_amount_final
    INTO v_request_id, v_status, v_total
  FROM tb_quotes WHERE id = p_quote_id
  FOR UPDATE;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'bad_state: quote is %', v_status;
  END IF;

  SELECT COUNT(*) INTO v_items_count FROM tb_quote_items WHERE quote_id = p_quote_id;
  IF v_items_count = 0 THEN
    RAISE EXCEPTION 'no_items';
  END IF;

  IF COALESCE(v_total, 0) <= 0 THEN
    RAISE EXCEPTION 'invalid_total';
  END IF;

  UPDATE tb_quotes SET
    status = 'sent',
    sent_at = now(),
    updated_at = now()
  WHERE id = p_quote_id;

  UPDATE tb_requests SET
    status = 'quote_sent',
    updated_at = now()
  WHERE id = v_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_send_tb_quote(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_send_tb_quote(uuid) TO authenticated;

-- Blocco 6
CREATE OR REPLACE FUNCTION public.admin_supersede_and_create_new_version(p_old_quote_id uuid)
RETURNS TABLE (
  new_quote_id uuid,
  previous_client_notes text,
  previous_decided_at timestamptz
)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
DECLARE
  v_old RECORD;
  v_new_id uuid;
  v_new_version int;
  v_request_status text;
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_old FROM tb_quotes WHERE id = p_old_quote_id FOR UPDATE;
  IF v_old.id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  IF v_old.status NOT IN ('modification_requested','rejected','accepted') THEN
    RAISE EXCEPTION 'bad_state: quote is %', v_old.status;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('tb_quote_newver_' || v_old.request_id::text));

  UPDATE tb_quotes SET status = 'superseded', updated_at = now()
  WHERE id = p_old_quote_id;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_new_version
  FROM tb_quotes WHERE request_id = v_old.request_id;

  INSERT INTO tb_quotes (
    request_id, version, status,
    total_amount_final, total_amount_ets,
    bravo_margin_amount, bravo_margin_percent,
    valid_until, terms_text,
    created_by
  ) VALUES (
    v_old.request_id, v_new_version, 'draft',
    v_old.total_amount_final, v_old.total_amount_ets,
    v_old.bravo_margin_amount, v_old.bravo_margin_percent,
    v_old.valid_until, v_old.terms_text,
    auth.uid()
  )
  RETURNING id INTO v_new_id;

  INSERT INTO tb_quote_items (
    quote_id, proposal_id, association_id,
    description, quantity,
    unit_price_ets, unit_price_final,
    total_ets, total_final,
    notes, display_order
  )
  SELECT
    v_new_id, proposal_id, association_id,
    description, quantity,
    unit_price_ets, unit_price_final,
    total_ets, total_final,
    notes, display_order
  FROM tb_quote_items WHERE quote_id = p_old_quote_id;

  SELECT status INTO v_request_status FROM tb_requests WHERE id = v_old.request_id;
  IF v_request_status IS DISTINCT FROM 'quote_in_composition' THEN
    UPDATE tb_requests SET
      status = 'quote_in_composition',
      updated_at = now()
    WHERE id = v_old.request_id;
  END IF;

  RETURN QUERY
  SELECT v_new_id, v_old.client_decision_notes, v_old.decided_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_supersede_and_create_new_version(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_supersede_and_create_new_version(uuid) TO authenticated;