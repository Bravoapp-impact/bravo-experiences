
-- Cron job 1: marca come completed le prenotazioni di eventi passati (ogni ora, minuto 5)
SELECT cron.schedule(
  'process-completed-events-hourly',
  '5 * * * *',
  $cron$
  SELECT public.process_completed_events();
  $cron$
);

-- Cron job 2: invia richieste di feedback post-evento (ogni ora, minuto 15)
SELECT cron.schedule(
  'send-feedback-request-hourly',
  '15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://cyazgtnjtnyxscfzsasp.supabase.co/functions/v1/send-feedback-request',
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
