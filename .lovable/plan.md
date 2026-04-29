
# Scaffolding super-admin TB Requests — piano rivisto

Aggiustamenti applicati: VIEW dedicata per "giorni in stato", backfill in transazione con LOCK, ordine di esecuzione documentato.

## 0. Risposte alle verifiche

**PageHeader condiviso** ✅ `src/components/common/PageHeader.tsx`. Riusato.

**Pattern status → label/color**: esiste solo un `statusConfig` locale in `HRTeamBuildingPage` con 7 stati legacy (incompleto). Nessun file `src/lib/tb-status.ts`. Lo creiamo come single source of truth con `Record<TBRequestStatus, ...>` esaustivo verificato dal compiler TypeScript.

**Backfill volume**: 6 `tb_requests` totali, tutte in `proposals_sent`. Backfill istantaneo.

**Pattern view nel codebase**: ✅ esiste `public.associations_public` (vedi `supabase/migrations/20260128142727_*.sql`) creata con `WITH (security_invoker=on)`. **Importante correzione al brief utente**: il default Postgres per le view è `security_invoker=off` (la view gira con i privilegi del *creator* — di solito postgres superuser — bypassando di fatto le RLS della tabella sottostante). Per ereditare correttamente le RLS del chiamante serve `security_invoker=on`, che è anche il pattern già adottato nel progetto. **Useremo `security_invoker=on`** per `tb_requests_with_status_since`, così la view rispetta le RLS di `tb_requests` (super_admin vede tutto, HR vede solo la propria company se in futuro userà la view, employee non vede nulla).

**Esaustività mappa stati**: garantita dal compiler via `Record<TBRequestStatus, TBStatusMeta>` su union literal di 15 valori.

---

## PARTE 1 — Migration SQL

File unico: `supabase/migrations/<timestamp>_tb_request_status_log.sql`

In testa al file, blocco di commento che fissa l'**ordine di esecuzione obbligatorio**:

```sql
-- =====================================================================
-- TB REQUEST STATUS LOG — migration
-- =====================================================================
-- ORDINE DI ESECUZIONE OBBLIGATORIO (NON RIORDINARE):
--   1.1  Tabella tb_request_status_log + indici + RLS
--   1.2  Trigger function + trigger AFTER INSERT/UPDATE su tb_requests
--   1.3  Backfill (in transazione con LOCK su tb_requests)
--   1.4  RPC get_tb_request_status_log_for_admin
--   1.5  Scalar function get_tb_request_current_status_since
--          + view tb_requests_with_status_since
--
-- MOTIVO: il trigger (1.2) deve esistere PRIMA del backfill (1.3).
-- Se il backfill girasse prima del trigger, ogni nuova request creata
-- nella finestra [backfill, trigger] non sarebbe loggata e produrrebbe
-- cronologia incompleta.
-- =====================================================================
```

### Blocco 1.1 — Tabella, indici, RLS

Tabella `tb_request_status_log` con FK CASCADE su tb_requests, indici su `request_id` e `changed_at DESC`, RLS:
- Super admin: SELECT + INSERT (no UPDATE/DELETE — append-only)
- HR: SELECT solo log delle richieste della propria company (via JOIN `tb_requests.company_id = get_user_company_id(auth.uid())`)

### Blocco 1.2 — Trigger function + trigger

`log_tb_request_status_change()` SECURITY DEFINER. Due trigger separati:
- `AFTER INSERT ON tb_requests`: log con `from_status=NULL, to_status=NEW.status`
- `AFTER UPDATE OF status ON tb_requests`: log solo se `OLD.status IS DISTINCT FROM NEW.status`

`changed_by = auth.uid()` (può essere NULL per insert sistemici via service role).

### Blocco 1.3 — Backfill in transazione con LOCK

```sql
BEGIN;
  -- LOCK SHARE MODE: blocca UPDATE concorrenti su tb_requests durante il backfill
  -- ma permette altre SELECT. Per 6 righe è zero costo.
  LOCK TABLE public.tb_requests IN SHARE MODE;

  INSERT INTO public.tb_request_status_log (request_id, from_status, to_status, changed_at, changed_by)
  SELECT r.id, NULL, r.status, r.created_at, NULL
  FROM public.tb_requests r
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tb_request_status_log l WHERE l.request_id = r.id
  );
COMMIT;
```

Razionale LOCK: senza il LOCK, una `tb_requests UPDATE` concorrente potrebbe far scattare il trigger (1.2) tra la SELECT del backfill e l'INSERT, producendo o un duplicato di entry "inizio" o un buco. Con SHARE MODE le UPDATE concorrenti aspettano il commit del backfill. Per 6 righe la transazione dura millisecondi.

### Blocco 1.4 — RPC get_tb_request_status_log_for_admin

`SECURITY DEFINER`, super_admin only, restituisce log + `changed_by_name` via LEFT JOIN profiles (concat first_name+last_name, fallback email), ordinato `changed_at ASC`.

### Blocco 1.5 — Scalar function + VIEW

```sql
CREATE OR REPLACE FUNCTION public.get_tb_request_current_status_since(p_request_id uuid)
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- TODO scaling: se tb_request_status_log supera ~10k righe per request,
  -- valutare denormalizzazione su tb_requests.status_since aggiornata da trigger.
  SELECT MAX(changed_at) FROM public.tb_request_status_log WHERE request_id = p_request_id;
$$;

-- VIEW dedicata per case list super-admin.
-- security_invoker=on → eredita le RLS di tb_requests (pattern già usato in associations_public).
-- PostgREST può leggerla come una tabella normale: una sola query dal client,
-- niente JOIN client-side, niente RPC per riga.
CREATE OR REPLACE VIEW public.tb_requests_with_status_since
WITH (security_invoker=on) AS
SELECT
  r.*,
  public.get_tb_request_current_status_since(r.id) AS status_since
FROM public.tb_requests r;

GRANT SELECT ON public.tb_requests_with_status_since TO authenticated;
```

---

## PARTE 2 — UI Scaffolding

### File nuovi

**`src/lib/tb-status.ts`**

```ts
export type TBRequestStatus =
  | 'draft' | 'submitted' | 'in_matching'
  | 'proposals_ready' | 'proposals_sent' | 'proposals_reviewed'
  | 'quote_requested' | 'quote_in_composition' | 'quote_sent'
  | 'quote_accepted' | 'quote_rejected'
  | 'signed' | 'event_scheduled' | 'completed' | 'cancelled';

export type TBStatusGroup =
  | 'admin_action_needed' | 'hr_action_needed'
  | 'in_progress' | 'completed' | 'closed';

export interface TBStatusMeta {
  value: TBRequestStatus;
  label: string;
  group: TBStatusGroup;
  badgeClass: string;
}

// Record forza esaustività al compile-time
export const TB_REQUEST_STATUS_META: Record<TBRequestStatus, TBStatusMeta> = { ... };

export function getTBStatusMeta(status: string): TBStatusMeta {
  return TB_REQUEST_STATUS_META[status as TBRequestStatus] ?? FALLBACK_META;
}
```

Mappa colori per gruppo:
- `admin_action_needed` → ambra
- `hr_action_needed` → blu
- `in_progress` → grigio
- `completed` → verde
- `closed` → rosso

**`src/pages/super-admin/TBRequestsPage.tsx`** — case list

`SuperAdminLayout` + `PageHeader` ("Richieste TB", `${count} richieste in lavorazione`).

Filtri: `Select` stato (15 opzioni da `TB_REQUEST_STATUS_META` + "Tutti") · `Select` azienda.

Fetch via **una sola query** sulla view:
```ts
supabase.from('tb_requests_with_status_since')
  .select('*, companies(name)')
  .order('created_at', { ascending: false })
```

Table colonne: Azienda · Titolo · Stato (Badge `getTBStatusMeta(status).badgeClass`) · Giorni in stato (`differenceInDays(now, status_since ?? created_at)`) · Data creazione (`d MMM yyyy` it).

Riga click → `/super-admin/team-building/richieste/${id}`. Skeleton + empty state.

**`src/pages/super-admin/TBRequestDetailPage.tsx`** — workspace

Header: back link, titolo + nome azienda, Badge stato grosso, "Creata il X · Aggiornata il Y".

Layout `lg:grid-cols-3 gap-6`:

**Sinistra `lg:col-span-1` sticky `lg:sticky lg:top-6`**:
- Card "Brief richiesta" (read-only): partecipanti, periodo, luoghi da `extra_services.places`, budget, servizi extra come chips, note
- Card "Cronologia" — timeline verticale da `get_tb_request_status_log_for_admin`: bullet + label leggibile (`getTBStatusMeta(to_status).label`) + relative time (`formatDistanceToNow` it) + autore se presente. Ordine ASC dall'alto.

**Destra `lg:col-span-2`** — switch su `request.status` (inline, niente file extra). Ogni branch è una `Card` shadcn con icon + descrizione + eventuale CTA placeholder che fa solo `toast({ title: 'Funzionalità in arrivo' })`. Niente bottoni `disabled`.

| Status | Contenuto |
|--------|-----------|
| `draft` | "L'HR sta ancora compilando il brief." |
| `submitted` / `in_matching` | "Pronto per il matching" + CTA placeholder |
| `proposals_ready` / `proposals_sent` | Lista compatta tb_proposals (format title + client_status) |
| `proposals_reviewed` | Come sopra + evidenza 'interested' + CTA "Richiedi quotazione ETS" placeholder |
| `quote_requested` | "Quotazione ETS in corso" + CTA "Componi preventivo" placeholder |
| `quote_in_composition` / `quote_sent` | Placeholder esplicito "Editor preventivo — disponibile nel prossimo aggiornamento" + se esiste tb_quote, riepilogo read-only via `get_tb_quote_history_for_admin` |
| `quote_accepted` / `signed` / `event_scheduled` / `completed` | "Stato avanzato — gestione in arrivo" |
| `quote_rejected` | "Richiesta chiusa" + `client_decision_notes` ultima quote rejected |
| `cancelled` | "Richiesta cancellata" (fallback statico) |

Loading skeleton, NotFound se request inesistente o errore forbidden.

### File modificati

**`src/components/layout/SuperAdminLayout.tsx`** — sotto "Catalogo TB":
```ts
{ label: "Richieste TB", icon: Inbox, href: "/super-admin/team-building/richieste" },
```

**`src/App.tsx`** — due nuove route protette `ProtectedSuperAdminRoute` accanto alle route catalogo TB.

### Pattern del codebase riusati

- `useQuery` + `supabase.from(...).select(...)` come `HRTBRequestDetailPage`
- `PageHeader` come `AccessRequestsPage`
- `Card`, `Table`, `Badge`, `Select`, `Skeleton` shadcn
- `format` / `formatDistanceToNow` da `date-fns` con locale `it`
- View con `security_invoker=on` come `associations_public`
- Italian UI / English DB enums

### Vincoli rispettati

- Nessuna mutazione, niente azioni reali — solo scaffolding read-only
- Niente fetch dentro componenti di presentazione
- Placeholder visivamente coerenti via Card + icon + descrizione
- Mappa stati TypeScript-checked

---

## Rischi residui

1. **`security_invoker=on` sulla view**: super_admin ha policy `ALL`, quindi vede tutto. HR ha policy SELECT filtrata per company → la view restituirà solo le richieste della propria company anche se in futuro la usassimo lato HR. Comportamento corretto.
2. **Stati DB non mappati**: fallback grigio "Sconosciuto", degradazione graceful.
3. **Linter Supabase**: la view potrebbe generare warning "view in API exposed without RLS" — falso positivo perché `security_invoker=on` delega a `tb_requests`. Se compare, lo annoteremo.

---

## Deliverables in ordine di esecuzione

1. Migration SQL (Blocchi 1.1 → 1.5 in singolo file con commento di ordine in testa)
2. `src/lib/tb-status.ts`
3. `src/pages/super-admin/TBRequestsPage.tsx`
4. `src/pages/super-admin/TBRequestDetailPage.tsx`
5. Modifica `SuperAdminLayout.tsx`
6. Modifica `App.tsx`

Pronto ad applicare al tuo OK.
