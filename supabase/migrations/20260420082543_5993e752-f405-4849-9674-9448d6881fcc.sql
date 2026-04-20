-- Drop email_templates table and its RLS policies.
-- The per-company template customization feature has been removed:
-- email copy is now hardcoded in the React Email templates under
-- supabase/functions/_shared/transactional-email-templates/.

DROP POLICY IF EXISTS "HR admin can update own company templates" ON public.email_templates;
DROP POLICY IF EXISTS "HR admin can view own company templates" ON public.email_templates;
DROP POLICY IF EXISTS "Super admin full access on email_templates" ON public.email_templates;

DROP TABLE IF EXISTS public.email_templates CASCADE;