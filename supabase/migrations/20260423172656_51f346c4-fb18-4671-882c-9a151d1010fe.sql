
-- Function 1: Automatic matching of formats for a TB request
CREATE OR REPLACE FUNCTION public.match_tb_formats_for_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_request RECORD;
  v_places jsonb;
  v_preferred_activities jsonb;
  v_format RECORD;
  v_priority int := 0;
BEGIN
  -- Verify caller is HR of the company that owns this request
  IF NOT has_role(auth.uid(), 'hr_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Load the request
  SELECT * INTO v_request FROM tb_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'request not found';
  END IF;

  -- Verify caller belongs to the same company
  IF v_request.company_id != get_user_company_id(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Don't create proposals if they already exist
  IF EXISTS (SELECT 1 FROM tb_proposals WHERE request_id = p_request_id) THEN
    RETURN;
  END IF;

  -- Extract places and preferred_activities from extra_services
  v_places := COALESCE(v_request.extra_services->'places', '[]'::jsonb);
  v_preferred_activities := COALESCE(v_request.extra_services->'preferred_activities', '[]'::jsonb);

  -- Find matching formats, score them, pick top 5
  FOR v_format IN
    SELECT
      f.id,
      f.category_id,
      -- Score: city match (or nationwide)
      CASE
        WHEN f.nationwide = true THEN 2
        WHEN EXISTS (
          SELECT 1 FROM tb_format_cities tfc
          JOIN cities c ON c.id = tfc.city_id
          WHERE tfc.format_id = f.id
            AND c.province IN (SELECT jsonb_array_elements_text(v_places))
        ) THEN 3
        ELSE 0
      END AS city_score,
      -- Score: participant overlap
      CASE
        WHEN v_request.participants_min IS NOT NULL AND v_request.participants_max IS NOT NULL
             AND f.participants_min IS NOT NULL AND f.participants_max IS NOT NULL
             AND f.participants_min <= v_request.participants_max
             AND f.participants_max >= v_request.participants_min
        THEN 2
        WHEN f.participants_min IS NULL AND f.participants_max IS NULL THEN 1
        ELSE 0
      END AS participants_score,
      -- Score: budget compatibility
      CASE
        WHEN v_request.budget_estimate IS NULL THEN 1
        WHEN f.price_range_min IS NOT NULL AND f.price_range_min <= v_request.budget_estimate THEN 2
        WHEN f.price_range_min IS NULL THEN 1
        ELSE 0
      END AS budget_score,
      -- Score: category preference
      CASE
        WHEN f.category_id IS NOT NULL
             AND f.category_id::text IN (SELECT jsonb_array_elements_text(v_preferred_activities))
        THEN 3
        ELSE 0
      END AS category_score
    FROM tb_formats f
    WHERE f.status = 'published'
    ORDER BY
      -- Filter out formats with zero city match (unless no places specified)
      CASE WHEN jsonb_array_length(v_places) = 0 THEN 1
           WHEN f.nationwide = true THEN 1
           WHEN EXISTS (
             SELECT 1 FROM tb_format_cities tfc
             JOIN cities c ON c.id = tfc.city_id
             WHERE tfc.format_id = f.id
               AND c.province IN (SELECT jsonb_array_elements_text(v_places))
           ) THEN 1
           ELSE 0
      END DESC,
      -- Then by total score
      (CASE WHEN f.nationwide THEN 2
            WHEN EXISTS (SELECT 1 FROM tb_format_cities tfc JOIN cities c ON c.id = tfc.city_id WHERE tfc.format_id = f.id AND c.province IN (SELECT jsonb_array_elements_text(v_places))) THEN 3
            ELSE 0 END)
      + (CASE WHEN v_request.participants_min IS NOT NULL AND f.participants_min IS NOT NULL AND f.participants_min <= v_request.participants_max AND f.participants_max >= v_request.participants_min THEN 2 WHEN f.participants_min IS NULL THEN 1 ELSE 0 END)
      + (CASE WHEN v_request.budget_estimate IS NULL THEN 1 WHEN f.price_range_min IS NOT NULL AND f.price_range_min <= v_request.budget_estimate THEN 2 WHEN f.price_range_min IS NULL THEN 1 ELSE 0 END)
      + (CASE WHEN f.category_id IS NOT NULL AND f.category_id::text IN (SELECT jsonb_array_elements_text(v_preferred_activities)) THEN 3 ELSE 0 END)
      DESC
    LIMIT 5
  LOOP
    -- Only insert formats that have at least some relevance (city_score > 0 or no places specified)
    v_priority := v_priority + 1;
    INSERT INTO tb_proposals (request_id, format_id, priority, client_status)
    VALUES (p_request_id, v_format.id, v_priority, 'pending');
  END LOOP;

  -- Update request status
  UPDATE tb_requests SET status = 'proposals_ready', updated_at = now()
  WHERE id = p_request_id;
END;
$$;


-- Function 2: Get proposal details for HR (no prices, no ETS info)
CREATE OR REPLACE FUNCTION public.get_tb_proposal_details(p_request_id uuid)
RETURNS TABLE (
  proposal_id uuid,
  format_id uuid,
  priority int,
  client_status text,
  client_notes text,
  format_title text,
  format_description text,
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
  -- Verify caller is HR of the company that owns this request
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
