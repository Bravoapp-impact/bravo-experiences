DO $$
DECLARE
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key' LIMIT 1;
  PERFORM net.http_post(
    url:='https://cyazgtnjtnyxscfzsasp.supabase.co/functions/v1/send-manager-absence-notifications',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
    body:='{}'::jsonb
  );
  PERFORM pg_sleep(15);
END $$;