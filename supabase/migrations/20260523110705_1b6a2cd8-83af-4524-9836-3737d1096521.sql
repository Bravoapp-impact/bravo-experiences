DO $$
DECLARE
  s text;
BEGIN
  SELECT decrypted_secret INTO s FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key';
  RAISE NOTICE 'len=% prefix=%', length(s), substring(s,1,7);
END $$;