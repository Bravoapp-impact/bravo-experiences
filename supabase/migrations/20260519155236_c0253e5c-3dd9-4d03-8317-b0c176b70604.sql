
-- 1. Profiles: manager_email (opzionale)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_email TEXT NULL;

-- 2. Companies: manager_notification_advance_days (default 7, 1-30)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS manager_notification_advance_days INTEGER NOT NULL DEFAULT 7
  CHECK (manager_notification_advance_days BETWEEN 1 AND 30);

-- 3. Estendi check constraint su email_logs per accettare manager_absence_notification
ALTER TABLE public.email_logs DROP CONSTRAINT IF EXISTS email_logs_email_type_check;
ALTER TABLE public.email_logs ADD CONSTRAINT email_logs_email_type_check
  CHECK (email_type = ANY (ARRAY[
    'booking_confirmation'::text,
    'booking_reminder'::text,
    'manager_absence_notification'::text
  ]));

-- 4. RPC per HR per aggiornare advance days
CREATE OR REPLACE FUNCTION public.set_manager_notification_advance_days(
  p_days INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin'::app_role) THEN
    RAISE EXCEPTION 'Permesso negato';
  END IF;

  IF p_days < 1 OR p_days > 30 THEN
    RAISE EXCEPTION 'Il preavviso deve essere tra 1 e 30 giorni';
  END IF;

  UPDATE public.companies
  SET manager_notification_advance_days = p_days
  WHERE id = get_user_company_id(auth.uid());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_manager_notification_advance_days(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_manager_notification_advance_days(INTEGER) TO authenticated;

-- 5. Cron job giornaliero (08:00 UTC)
SELECT cron.schedule(
  'send-manager-absence-notifications-daily',
  '0 8 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://cyazgtnjtnyxscfzsasp.supabase.co/functions/v1/send-manager-absence-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- Aggiorna protect_companies_hr_update per consentire HR a leggere il nuovo campo ma non modificarlo
-- (lo modifica solo via RPC set_manager_notification_advance_days)
CREATE OR REPLACE FUNCTION public.protect_companies_hr_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
       OR NEW.manager_notification_advance_days IS DISTINCT FROM OLD.manager_notification_advance_days
    THEN
      RAISE EXCEPTION 'HR can only update suggestion_token on companies';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
