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
) AS request_id;