CREATE OR REPLACE VIEW public.associations_public
WITH (security_invoker = off) AS
SELECT id, name, description, website, logo_url, status, address, created_at, updated_at
FROM public.associations;

GRANT SELECT ON public.associations_public TO authenticated;