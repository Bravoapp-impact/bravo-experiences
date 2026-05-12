CREATE OR REPLACE FUNCTION public.hr_mark_tb_quote_viewed(p_quote_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT q.status INTO v_status
  FROM tb_quotes q
  JOIN tb_requests r ON r.id = q.request_id
  WHERE q.id = p_quote_id
    AND r.company_id = get_user_company_id(auth.uid());

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_status = 'sent' THEN
    UPDATE tb_quotes
    SET status = 'viewed',
        viewed_at = COALESCE(viewed_at, now()),
        updated_at = now()
    WHERE id = p_quote_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.hr_mark_tb_quote_viewed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hr_mark_tb_quote_viewed(uuid) TO authenticated;