# Fix: associazione automatica azienda da dominio email

## Problema

In `src/lib/auth.ts` il flow di signup senza access code non invia `company_id` nei metadata, con il commento esplicito:

> "the server-side handle_new_user trigger resolves the company from the email domain."

Ma il trigger DB `public.handle_new_user()` **non fa questa risoluzione**: legge solo `raw_user_meta_data->>'company_id'`. Risultato: i nuovi utenti registrati via dominio aziendale (es. `@havas.com`) finiscono con `profiles.company_id = NULL` e `user_tenants.company_id = NULL`, quindi nessuna esperienza attivata per la loro company è visibile (RLS su `experiences` / `experience_companies` filtra per `get_user_company_id(auth.uid())`).

## Soluzione

Modificare il trigger `handle_new_user()` in modo che, **se `company_id` non è nei metadata**, provi a risolverlo dal dominio dell'email contro `companies.allowed_email_domains` (lookup case-insensitive). Stessa logica applicata sia all'INSERT in `profiles` sia in `user_tenants`.

Pseudo-logica aggiunta:

```text
v_company_id := metadata.company_id  (come oggi)
IF v_company_id IS NULL AND v_role = 'employee' THEN
  v_email_domain := lower(split_part(NEW.email, '@', 2))
  SELECT id INTO v_company_id
    FROM companies
   WHERE v_email_domain = ANY (
     SELECT lower(d) FROM unnest(allowed_email_domains) d
   )
   LIMIT 1
END IF
```

Il resto del trigger resta invariato (gender, user_roles, fallback EXCEPTION).

## File toccati

1. **Migration** — `CREATE OR REPLACE FUNCTION public.handle_new_user()` con la risoluzione domain → company aggiunta. Nessuna modifica a tabelle/policy.
2. **`src/lib/auth.ts`** — nessuna modifica al codice, ma il commento esistente diventa accurato.

## Backfill utenti esistenti

Query `profiles` con `company_id IS NULL` su employee: **0 utenti** attualmente. Non serve backfill (HAVAS è l'unica company con `allowed_email_domains` valorizzato e tutti i suoi iscritti hanno già un company_id, probabilmente perché entrati via access code).

Posso aggiungere comunque uno statement di backfill nella migration per sicurezza (UPDATE profiles + user_tenants per qualunque employee con company_id NULL il cui dominio matcha): dimmi se lo vuoi incluso.

## Note

- La risoluzione vale solo per `v_role = 'employee'` (i ruoli `hr_admin` / `association_admin` arrivano sempre via access code con entity_id esplicito).
- Se il dominio matcha più di una company (caso non presente oggi), prendiamo la prima — comportamento accettabile dato che `allowed_email_domains` dovrebbe essere disgiunto tra company.
