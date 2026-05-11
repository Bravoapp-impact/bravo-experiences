DROP FUNCTION IF EXISTS public.get_tb_proposal_details(uuid);

CREATE FUNCTION public.get_tb_proposal_details(p_request_id uuid)
RETURNS TABLE (
  proposal_id uuid,
  format_id uuid,
  priority int,
  client_status text,
  client_notes text,
  format_title text,
  format_description text,
  format_short_description text,
  format_image_url text,
  format_category_id uuid,
  format_category_name text,
  format_duration_hours numeric,
  format_participants_min int,
  format_participants_max int,
  format_location_type text,
  format_sdgs text[],
  format_secondary_tags text[],
  format_services jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin') THEN
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
    p.id AS proposal_id,
    p.format_id,
    p.priority,
    p.client_status,
    p.client_notes,
    f.title AS format_title,
    f.description AS format_description,
    f.short_description AS format_short_description,
    f.image_url AS format_image_url,
    f.category_id AS format_category_id,
    c.name AS format_category_name,
    f.duration_hours AS format_duration_hours,
    f.participants_min AS format_participants_min,
    f.participants_max AS format_participants_max,
    f.location_type AS format_location_type,
    f.sdgs AS format_sdgs,
    f.secondary_tags AS format_secondary_tags,
    f.services AS format_services
  FROM tb_proposals p
  JOIN tb_formats f ON f.id = p.format_id
  LEFT JOIN categories c ON c.id = f.category_id
  WHERE p.request_id = p_request_id
  ORDER BY p.priority;
END;
$$;