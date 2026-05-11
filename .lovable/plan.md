## Problema

La view `associations_public` è stata creata con `security_invoker=on`. Significa che la query gira con i permessi del ruolo chiamante, e la RLS della tabella `associations` permette `SELECT` solo a super_admin e association_admin (sulla propria). Risultato: employee e HR Admin leggono **zero righe** dalla view, il join in app cade sul fallback legacy `experiences.association_name`, che è vuoto per le esperienze nuove (es. "Il Balzo ETS") → card senza nome né logo.

Lo screenshot lo conferma: "Piccoli lavori manuali" mostra "La Taska Onlus" solo perché il campo legacy era valorizzato; "Giochi e attività manuali coi bimbi" (Il Balzo ETS) non lo era.

## Cosa cambia

Una sola migration: ricreare la view `associations_public` con `security_invoker=off` (definer-mode), così bypassa la RLS di `associations` ma resta sicura perché espone solo campi non sensibili (id, name, description, website, logo_url, status, address, created_at, updated_at — niente email, telefono, note interne, contact_name, partnership_start_date).

Concedere `SELECT` su `associations_public` ad `authenticated`.

## Cosa NON cambia

- RLS della tabella `associations`: invariata. Resta blindata, accessibile solo a super_admin e association_admin proprietario.
- Codice frontend: già fatto nel passaggio precedente (employee catalog, HR catalog, HR stats, HR detail leggono tutti dalla view).
- Schema: nessuna colonna aggiunta o rimossa.
- Nessun DROP della view: si usa `CREATE OR REPLACE VIEW`.

## Tecnico

```sql
CREATE OR REPLACE VIEW public.associations_public
WITH (security_invoker = off) AS
SELECT id, name, description, website, logo_url, status, address, created_at, updated_at
FROM public.associations;

GRANT SELECT ON public.associations_public TO authenticated;
```

Nessun `REVOKE`/`DROP` distruttivo. `CREATE OR REPLACE` mantiene oggetti dipendenti.

## Self-review sicurezza

- Un utente di company A può ora leggere il nome/logo di tutte le associazioni: **accettabile**. Sono dati che già appaiono pubblicamente sulle card delle esperienze e su `bravo.it`. Non sono PII.
- Email, telefono, note interne, data partnership, contact_name, nationwide: **restano bloccati** (non presenti nella view, e tabella base sempre RLS-protetta).
- Nessuna scrittura possibile dalla view (è SELECT-only).

## Verifica post-deploy

Aprire `/app/experiences` come employee (Filippo già loggato): tutte le card devono mostrare logo + nome associazione. Aprire `/hr/experiences` come HR: idem.