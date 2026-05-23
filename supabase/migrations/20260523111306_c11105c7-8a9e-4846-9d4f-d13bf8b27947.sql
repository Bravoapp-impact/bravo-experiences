UPDATE companies SET manager_notification_advance_days=4 WHERE id='5a6cc444-8740-4964-b668-9c490c09c3e9';

DO $$
DECLARE
  v_key text;
  v_req bigint;
BEGIN
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key' LIMIT 1;
  SELECT net.http_post(
    url:='https://cyazgtnjtnyxscfzsasp.supabase.co/functions/v1/send-manager-absence-notifications',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
    body:='{}'::jsonb
  ) INTO v_req;
  RAISE NOTICE 'request_id=%', v_req;
  PERFORM pg_sleep(6);
END $$;

UPDATE companies SET manager_notification_advance_days=7 WHERE id='5a6cc444-8740-4964-b668-9c490c09c3e9';