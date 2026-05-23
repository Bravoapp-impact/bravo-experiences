CREATE TABLE IF NOT EXISTS public._tmp_secret_inspect (id serial primary key, info text, checked_at timestamptz default now());
INSERT INTO public._tmp_secret_inspect (info)
SELECT format('len=%s prefix=%s suffix=%s', length(decrypted_secret), substring(decrypted_secret,1,12), substring(decrypted_secret, length(decrypted_secret)-7, 8))
FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key';