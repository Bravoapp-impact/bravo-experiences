-- Fix 1: pubblica tutti i format draft (catalogo iniziale)
UPDATE public.tb_formats SET status = 'published' WHERE status = 'draft';

-- Fix 2: riscrive match_tb_formats_for_request con logica più permissiva + fallback nationwide
CREATE OR REPLACE FUNCTION public.match_tb_formats_for_request(p_request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $function$
DECLARE
  v_request RECORD;
  v_places jsonb;
  v_preferred_activities jsonb;
  v_format RECORD;
  v_priority int := 0;
  v_inserted_count int := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin') AND NOT has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_request FROM tb_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'request not found';
  END IF;

  IF NOT has_role(auth.uid(), 'super_admin')
     AND v_request.company_id != get_user_company_id(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF EXISTS (SELECT 1 FROM tb_proposals WHERE request_id = p_request_id) THEN
    RAISE LOG 'match_tb_formats: proposals already exist for request %', p_request_id;
    RETURN;
  END IF;

  v_places := COALESCE(v_request.extra_services->'places', '[]'::jsonb);
  -- Legacy fallback for older requests using 'province' (string)
  IF jsonb_array_length(v_places) = 0 AND v_request.extra_services ? 'province' THEN
    v_places := jsonb_build_array(v_request.extra_services->>'province');
  END IF;
  v_preferred_activities := COALESCE(v_request.extra_services->'preferred_activities', '[]'::jsonb);

  RAISE LOG 'match_tb_formats: request=% places=% activities=% participants=[%,%] budget=%',
    p_request_id, v_places, v_preferred_activities,
    v_request.participants_min, v_request.participants_max, v_request.budget_estimate;

  FOR v_format IN
    SELECT
      f.id,
      (
        CASE
          WHEN EXISTS (
            SELECT 1 FROM tb_format_cities tfc
            JOIN cities c ON c.id = tfc.city_id
            WHERE tfc.format_id = f.id
              AND c.province IN (SELECT jsonb_array_elements_text(v_places))
          ) THEN 3
          WHEN f.nationwide = true THEN 2
          ELSE 0
        END
        +
        CASE
          WHEN v_request.participants_min IS NOT NULL AND v_request.participants_max IS NOT NULL
               AND f.participants_min IS NOT NULL AND f.participants_max IS NOT NULL
               AND f.participants_min <= v_request.participants_max
               AND f.participants_max >= v_request.participants_min
          THEN 2
          WHEN f.participants_min IS NULL AND f.participants_max IS NULL THEN 1
          ELSE 0
        END
        +
        CASE
          WHEN v_request.budget_estimate IS NULL THEN 1
          WHEN f.price_range_min IS NOT NULL AND f.price_range_min <= v_request.budget_estimate THEN 2
          WHEN f.price_range_min IS NULL THEN 1
          ELSE 0
        END
        +
        CASE
          WHEN f.category_id IS NOT NULL
               AND f.category_id::text IN (SELECT jsonb_array_elements_text(v_preferred_activities))
          THEN 3
          ELSE 0
        END
      ) AS total_score,
      (
        jsonb_array_length(v_places) = 0
        OR f.nationwide = true
        OR EXISTS (
          SELECT 1 FROM tb_format_cities tfc
          JOIN cities c ON c.id = tfc.city_id
          WHERE tfc.format_id = f.id
            AND c.province IN (SELECT jsonb_array_elements_text(v_places))
        )
      ) AS passes_location_filter
    FROM tb_formats f
    WHERE f.status = 'published'
    ORDER BY passes_location_filter DESC, total_score DESC, f.created_at DESC
    LIMIT 5
  LOOP
    IF v_format.passes_location_filter THEN
      v_priority := v_priority + 1;
      INSERT INTO tb_proposals (request_id, format_id, priority, client_status)
      VALUES (p_request_id, v_format.id, v_priority, 'pending');
      v_inserted_count := v_inserted_count + 1;
    END IF;
  END LOOP;

  RAISE LOG 'match_tb_formats: inserted % proposals for request %', v_inserted_count, p_request_id;

  -- Fallback: se zero match, proponi top 5 nationwide
  IF v_inserted_count = 0 THEN
    RAISE LOG 'match_tb_formats: fallback to nationwide for request %', p_request_id;
    FOR v_format IN
      SELECT f.id
      FROM tb_formats f
      WHERE f.status = 'published'
        AND f.nationwide = true
      ORDER BY
        CASE WHEN f.category_id IS NOT NULL
             AND f.category_id::text IN (SELECT jsonb_array_elements_text(v_preferred_activities))
             THEN 1 ELSE 0 END DESC,
        f.created_at DESC
      LIMIT 5
    LOOP
      v_priority := v_priority + 1;
      INSERT INTO tb_proposals (request_id, format_id, priority, client_status)
      VALUES (p_request_id, v_format.id, v_priority, 'pending');
      v_inserted_count := v_inserted_count + 1;
    END LOOP;
  END IF;

  -- Aggiorna lo stato (valore corretto da CHECK constraint)
  UPDATE tb_requests SET status = 'proposals_sent', updated_at = now()
  WHERE id = p_request_id;
END;
$function$;

-- Fix 3: re-run matching for existing requests senza proposte
DO $$
DECLARE
  r RECORD;
  v_request RECORD;
  v_places jsonb;
  v_preferred_activities jsonb;
  v_format RECORD;
  v_priority int;
  v_inserted_count int;
BEGIN
  FOR r IN
    SELECT id FROM tb_requests
    WHERE NOT EXISTS (SELECT 1 FROM tb_proposals p WHERE p.request_id = tb_requests.id)
  LOOP
    v_priority := 0;
    v_inserted_count := 0;
    SELECT * INTO v_request FROM tb_requests WHERE id = r.id;
    v_places := COALESCE(v_request.extra_services->'places', '[]'::jsonb);
    IF jsonb_array_length(v_places) = 0 AND v_request.extra_services ? 'province' THEN
      v_places := jsonb_build_array(v_request.extra_services->>'province');
    END IF;
    v_preferred_activities := COALESCE(v_request.extra_services->'preferred_activities', '[]'::jsonb);

    FOR v_format IN
      SELECT f.id,
        (jsonb_array_length(v_places) = 0
         OR f.nationwide = true
         OR EXISTS (SELECT 1 FROM tb_format_cities tfc JOIN cities c ON c.id = tfc.city_id
                    WHERE tfc.format_id = f.id AND c.province IN (SELECT jsonb_array_elements_text(v_places)))
        ) AS passes_location_filter,
        (CASE WHEN EXISTS (SELECT 1 FROM tb_format_cities tfc JOIN cities c ON c.id = tfc.city_id WHERE tfc.format_id = f.id AND c.province IN (SELECT jsonb_array_elements_text(v_places))) THEN 3
              WHEN f.nationwide THEN 2 ELSE 0 END)
        + (CASE WHEN v_request.participants_min IS NOT NULL AND f.participants_min IS NOT NULL AND f.participants_min <= v_request.participants_max AND f.participants_max >= v_request.participants_min THEN 2 WHEN f.participants_min IS NULL THEN 1 ELSE 0 END)
        + (CASE WHEN v_request.budget_estimate IS NULL THEN 1 WHEN f.price_range_min IS NOT NULL AND f.price_range_min <= v_request.budget_estimate THEN 2 WHEN f.price_range_min IS NULL THEN 1 ELSE 0 END)
        + (CASE WHEN f.category_id IS NOT NULL AND f.category_id::text IN (SELECT jsonb_array_elements_text(v_preferred_activities)) THEN 3 ELSE 0 END)
        AS total_score
      FROM tb_formats f
      WHERE f.status = 'published'
      ORDER BY passes_location_filter DESC, total_score DESC
      LIMIT 5
    LOOP
      IF v_format.passes_location_filter THEN
        v_priority := v_priority + 1;
        INSERT INTO tb_proposals (request_id, format_id, priority, client_status)
        VALUES (r.id, v_format.id, v_priority, 'pending');
        v_inserted_count := v_inserted_count + 1;
      END IF;
    END LOOP;

    IF v_inserted_count = 0 THEN
      FOR v_format IN
        SELECT f.id FROM tb_formats f
        WHERE f.status = 'published' AND f.nationwide = true
        ORDER BY f.created_at DESC LIMIT 5
      LOOP
        v_priority := v_priority + 1;
        INSERT INTO tb_proposals (request_id, format_id, priority, client_status)
        VALUES (r.id, v_format.id, v_priority, 'pending');
      END LOOP;
    END IF;

    UPDATE tb_requests SET status = 'proposals_sent', updated_at = now() WHERE id = r.id;
  END LOOP;
END $$;