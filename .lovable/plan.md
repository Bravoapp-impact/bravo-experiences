# Fix: ricorsione RLS su `profiles` blocca tutti gli update self-service

## Diagnosi

I log Postgres mostrano 7 errori consecutivi `infinite recursion detected in policy for relation "profiles"` coincidenti con il tentativo di salvare `manager_email`. La causa è la policy `Users can update own profile (no role/tenancy)`: la sua `WITH CHECK` contiene tre subquery `SELECT ... FROM profiles WHERE id = auth.uid()` per verificare che `role`/`company_id`/`association_id` non cambino. Ogni subquery riattiva la stessa policy → ricorsione.

## Altri update path impattati (risposta esplicita)

Il problema **non è limitato a `manager_email`**. Ogni UPDATE su `profiles` fatto come utente stesso passa per quella policy e fallisce. Path attualmente rotti, individuati nel codice:

- `src/components/profile/ProfileEditForm.tsx` — modifica `first_name` / `last_name` (employee)
- `src/components/profile/ProfileAvatarUpload.tsx` — upload e rimozione avatar (employee)
- `src/components/profile/ManagerEmailCard.tsx` — `manager_email` (employee, caso segnalato)
- `src/components/settings/ProfileSettingsContent.tsx` — nome e avatar (HR, association admin)
- `src/pages/hr/settings/SettingsProfile.tsx` — nome e avatar (HR)

Funziona invece l'update fatto dal super admin su profili altrui, perché coperto dalla policy separata `Super admins can update any profile`.

Una volta applicato il fix tutti questi flussi tornano operativi senza modifiche al client.

## Soluzione (3 step ordinati, una sola migration)

### Step 1 — trigger BEFORE UPDATE con funzione SECURITY DEFINER

Funzione `public.prevent_profile_self_tenancy_change()`:
- `SECURITY DEFINER`, `SET search_path = public, pg_temp`.
- Logica: se `auth.uid() = NEW.id` **e** l'utente NON è super_admin, e uno tra `role`, `company_id`, `association_id` è `IS DISTINCT FROM` il valore in `OLD` → `RAISE EXCEPTION 'Cannot change role/company_id/association_id on own profile'`.
- Super admin passa sempre, anche quando aggiorna se stesso (coerente con `admin_set_user_role`).
- `REVOKE EXECUTE ... FROM PUBLIC` (la funzione gira solo come trigger, nessun GRANT esplicito serve).

Trigger `prevent_profile_self_tenancy_change_trg` `BEFORE UPDATE ON public.profiles FOR EACH ROW`.

### Step 2 — nuova policy con nome diverso

```sql
CREATE POLICY "Users can update own profile v2"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

Nome volutamente diverso per coesistere con la vecchia (RLS in OR): da questo momento gli update self-service iniziano a funzionare e il trigger garantisce l'invariante su `role`/`company_id`/`association_id`.

### Step 3 — drop policy vecchia

```sql
DROP POLICY "Users can update own profile (no role/tenancy)" ON public.profiles;
```

Eseguito per ultimo, rispettando la regola "aggiungi prima, rimuovi dopo" di `docs/CLAUDE.md`.

## Verifica post-fix

1. Dipendente salva `manager_email` → toast successo, nessun errore nei log Postgres.
2. Dipendente modifica nome o avatar → ok.
3. HR/association admin modificano il proprio profilo → ok.
4. Tentativo client di UPDATE `role` o `company_id` su se stessi → exception bloccante dal trigger.
5. Super admin cambia ruolo di un altro profilo via `admin_set_user_role` → ok (path già coperto, non toccato).

## Documentazione

Update minimi a fine sessione:
- `docs/log.md`: entry "Fix ricorsione RLS profiles, sblocco update self-service".
- `docs/architettura.md`: §3 "RLS — i pattern", aggiungere riga sul trigger `prevent_profile_self_tenancy_change` come esempio di invariante non esprimibile in RLS senza ricorsione.
