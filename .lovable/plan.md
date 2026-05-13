## Step 2 — Riscrittura lista HR `/hr/team-building` (modello bacheca)

### Cosa cambia

Riscrittura di `src/pages/hr/HRTeamBuildingPage.tsx` da struttura attuale (Bozze + Attive + Storico, basata sui 15 valori di `tb_requests.status`) a **tre sezioni** guidate dal nuovo `tb_requests.state` (4 valori, già aggiunto in Step 1):

1. **Eventi in programma** — `state = 'confirmed'`. Card grande con immagine del format e badge data overlay (pattern `BookingCard`).
2. **Richieste in corso** — `state = 'open'` (include anche le bozze, vedi sotto). Card con placeholder tonale + icona di categoria, titolo, **pill di stato** calcolata client-side.
3. **Archivio** — `state in ('completed','cancelled')`. Card `dimmed=true`, badge esito, sezione `Collapsible` chiusa di default.

In tutte le sezioni: card cliccabile → navigazione al dettaglio. **Nessuna CTA esplicita** sulla card.

### Bozze unificate dentro "Richieste in corso"

Decisione: niente più sezione "Bozze" separata. Una `tb_request` con `status='draft'` ricade comunque in `state='open'` (il GENERATED dello Step 1 mappa `draft → open`), quindi è coerente mostrarla tra le altre richieste in corso. La pill "Brief incompleto" (tono ambra, "azione richiesta") la rende immediatamente riconoscibile e cliccabile per riprendere il wizard.

Conseguenze:
- Pill HR con un caso aggiuntivo che precede tutti gli altri (impedisce ogni altra azione):

| Pill | Condizione | Tono |
|---|---|---|
| Brief incompleto | `tb_requests.status = 'draft'` | ambra |
| Preventivo da decidere | esiste `tb_quote` con `status in ('sent','viewed')` | ambra |
| N proposte da valutare | esistono `tb_proposals` con `is_active=true` AND `client_status='pending'` | ambra |
| Preventivo in lavorazione | esiste `tb_quote` con `status in ('draft','modification_requested')` | grigio |
| Proposte in arrivo | fallback | grigio |

- `detailRoute()` resta com'è: bozze → `/hr/team-building/brief/:id`, tutte le altre → `/hr/team-building/:id`.
- L'`AlertDialog` "Hai una bozza in sospeso" e la logica anti-duplicato bozze restano invariati.
- Ordinamento "Richieste in corso": `preferred_period_from ASC NULLS LAST, updated_at DESC`. Le bozze (spesso senza periodo) finiscono in coda per recency. Se preferisci tirarle in cima dimmelo.

### Icona categoria sulla card "Richiesta in corso"

Il wizard già raccoglie le preferenze al passo 3 e le salva in `tb_requests.extra_services.preferred_activities` come array di category UUID (oppure `["none"]` se l'utente ha scelto "Non ho ancora nessuna attività in mente"). **Nessuna nuova colonna, nessun cambio al wizard.**

Lato lista usiamo questo array così com'è:

- Se `preferred_activities` ha almeno un UUID valido → prendiamo il primo (il wizard è multi-select ma per la card serve un'unica icona) e lo mappiamo a una `LucideIcon` tramite un piccolo helper `src/lib/tb-category-icons.ts` (categoryId → icona, fallback `Sparkles`).
- Se è `["none"]`, vuoto, o mancante → icona generica `Sparkles`.
- Sfondo placeholder: `bg-muted` neutro.

Le categorie sono 11 fisse (memory `Categories & Lookup`), quindi una mappa per UUID resta gestibile e centralizzata. La useremo anche in Step 4/5 per coerenza visiva.

Nota: nessuna lettura cross-tabella — l'array è già dentro `tb_requests`, la query non cambia.

### Fetching dati

Una `useQuery` aggregatrice con 4 query parallele (volumi attesi bassi, RLS company-scoped):

1. `tb_requests` company-scoped: `id, title, status, state, created_at, updated_at, participants_min, participants_max, preferred_period_from, preferred_period_to, extra_services`.
2. `tb_proposals` con `is_active, client_status, request_id` filtrate `.in('request_id', openIds)`.
3. `tb_quotes` con `status, request_id` filtrate `.in('request_id', openIds)`.
4. `tb_events` con `scheduled_datetime, request_id, title, format:tb_formats(image_url)` filtrate `.in('request_id', confirmedIds)`.

Aggregazione client-side per request → `pill`, `eventDate`, `formatImage`, `categoryIcon`. Nessuna nuova RPC, nessun cambio RLS.

### Componenti

**Riusati:** `BravoCard` (con `imageOverlay` per badge data), `BaseCardImage`, `Collapsible` per Archivio, `AlertDialog` per gestione bozza esistente, piccolo `StatusSection` interno alla pagina (identico ad `AssociationExperiencesPage.tsx`).

**Da deprecare:** `ActiveCard`, `HistoryCard`, `statusPresentationConfig`, `getPresentation`, `Bucket` interni al file.

**Nuovo:** `src/lib/tb-category-icons.ts` — helper `categoryId → LucideIcon`.

**Da archiviare:** `docs/team-building-nuova-interfaccia.md` → `docs/archive/` se esiste.

### Ordinamento

- Eventi in programma: `tb_events.scheduled_datetime ASC`.
- Richieste in corso: `tb_requests.preferred_period_from ASC NULLS LAST, updated_at DESC`.
- Archivio: `tb_requests.updated_at DESC`.

### Cosa NON cambia

- **Schema DB**: nessuna migration. `tb_requests`, `tb_proposals`, `tb_quotes`, `tb_events`, `tb_request_status_log` invariati.
- **Wizard `/hr/team-building/nuova-richiesta` e `/hr/team-building/brief/:id`**: nessuna modifica. `extra_services.preferred_activities` resta con la stessa shape.
- **RLS, RPC, edge function, email**: nessuna modifica. Le email continuano a essere triggerate dai cambi di `status` finché non arriviamo a Step 6.
- **Pagina dettaglio HR `/hr/team-building/:id`**: non si tocca (Step 5).
- **Pagina super-admin `/super-admin/team-building/richieste/:id`**: non si tocca (Step 4).
- **Empty state**: copy + CTA "Inizia ora" identici a oggi.
- **Logica anti-duplicato bozze**: invariata.
- **Navigazione, sidebar, header, layout HR**: invariati.

### Implicazioni e rischi

- **Coerenza dati**: `state='open'` include sia bozze sia richieste vere. La pill "Brief incompleto" comunica esplicitamente lo stato e la rotta porta al wizard.
- **Backward compat**: richieste storiche con `extra_services` vuoto o senza `preferred_activities` → icona fallback. Nessun bug.
- **Multi-categoria → icona singola**: scelta deliberata di prendere `preferred_activities[0]` per la card. Sul dettaglio (Step 5) mostreremo l'array completo.
- **N+1 evitato** con `.in()`.
- **Sicurezza**: nessun touch su RLS o policy. Nessuna RPC creata. Self-review esplicita: nessuna esposizione di dati cross-company.
- **Performance**: 4 query parallele su tabelle piccole. Cache React Query con `queryKey: ['tb-requests-list', company_id]`.
- **Mobile**: la lista resta fruibile da mobile (la nota desktop-only del documento riguarda il dettaglio a due colonne).

### Verifica

- Account HR con: 1 bozza (status='draft'), 1 richiesta `open` con proposte pending, 1 con quote sent, 1 confermata, 1 cancellata → controllo visuale sezioni e pill.
- Card di una bozza mostra pill "Brief incompleto" e cliccando porta al wizard.
- Una richiesta con `preferred_activities=["uuid-categoria-X"]` mostra l'icona corretta; con `["none"]` o vuoto mostra il fallback.
- Empty state quando nessuna richiesta esiste.
- Nessun warning console, nessun errore di rete.

### File toccati

- `src/pages/hr/HRTeamBuildingPage.tsx` — riscrittura completa.
- `src/lib/tb-category-icons.ts` — nuovo helper.
- (eventuale) `docs/team-building-nuova-interfaccia.md` → `docs/archive/`.
- `docs/log.md` — entry sessione.
