# Architettura

La mappa della web app di Bravo!.

## 1. Stack

Frontend: **React + Vite + TypeScript**, **shadcn/ui** per le primitive UI, **Tailwind** per lo styling, **TanStack Query** per il data fetching, **react-hook-form + zod** per i form complessi, **react-router-dom** per il routing, **sonner** per i toast.

Backend: **Supabase** (Postgres con RLS, Auth, Storage, Edge Functions in Deno). Code email su **pgmq**, scheduling su **pg_cron**, segreti su **supabase_vault**.

Email: pipeline **Lovable native** sul dominio verificato `updates.bravoapp.it`.

---

## 2. Modello dei dati per area funzionale

Sei aree, ognuna con le sue tabelle. Le aree non sono cartelle: sono raggruppamenti logici. Il principio: **gli oggetti dominio condivisi sono uno solo per tutto il sistema**, i verticali aggiungono le proprie tabelle senza ricreare oggetti già esistenti (vedi `principi.md` §1 e §3).

### 2.1 Oggetti dominio condivisi

| Tabella | Cosa è |
| --- | --- |
| `companies` | Le aziende clienti |
| `profiles` | Persone, estende `auth.users`. Collegate a `company_id` o `association_id` in base al ruolo |
| `associations` | Gli ETS della rete Bravo! |
| `association_cities` | Bridge N:N — un ETS opera in più città |
| `cities` | Anagrafica città (riferimento per esperienze, ETS, format TB) |
| `categories` | Anagrafica categorie attività con default SDG |

### 2.2 Identità e accesso

| Tabella | Cosa è |
| --- | --- |
| `user_roles` | Tabella separata da `profiles` per evitare ricorsioni RLS. Enum `app_role`: `employee`, `hr_admin`, `association_admin`, `super_admin` |
| `access_codes` | Codici per registrarsi e venire associati a una company o association con un ruolo |
| `access_requests` | Lead in ingresso dalla landing (employee senza codice, company lead, association lead, individui in waitlist) |

### 2.3 Volontariato

| Tabella | Cosa è |
| --- | --- |
| `experiences` | Esperienze di volontariato pubblicate dagli ETS |
| `experience_companies` | Bridge N:N — quali aziende vedono quali esperienze |
| `experience_dates` | Date specifiche di una esperienza con capienza |
| `bookings` | Prenotazioni dei dipendenti |

### 2.4 Team Building

Il verticale più recente. Sei tabelle "core" + due di supporto, tutte con prefisso `tb_`. Nessuna tocca tabelle del volontariato. Flusso completo in `tb-flow.md`.

| Tabella | Cosa è |
| --- | --- |
| `tb_formats` | Catalogo dei format di team building |
| `tb_format_associations` | Bridge — quali ETS possono erogare un format |
| `tb_format_cities` | Bridge — in quali città è disponibile un format |
| `tb_requests` | Richieste aperte dei clienti, con macchina degli stati |
| `tb_proposals` | Schede inviate al cliente in risposta a una richiesta |
| `tb_quotes` | Preventivi (versioning attivo, mai DELETE: le vecchie versioni vanno in `superseded`) |
| `tb_quote_items` | Voci di un preventivo. Contiene sia colonne ETS (sensibili) sia colonne finali (mostrate al cliente) |
| `tb_contracts` | Firma. V1 = `manual_external` (PDF gestito fuori app), V2 = firma in-app |
| `tb_events` | Esecuzione dell'evento, con `public_slug` per pagina pubblica iscrizioni |
| `tb_event_participants` | Iscritti all'evento (form pubblico, no auth) |
| `tb_request_status_log` | Audit trail dei cambi di stato, popolato da trigger |
| `tb_matching_decisions` | Log di ogni decisione di matching, dataset per AI futura |

### 2.5 Infrastruttura email

Pipeline a coda con retry e suppression. Dettagli in `transactional-emails.md`.

| Tabella | Cosa è |
| --- | --- |
| `email_send_log` | Audit di ogni tentativo di invio (`pending`, `sent`, `failed`, `bounced`, ...) |
| `email_send_state` | Riga unica con cooldown rate-limit e parametri di throughput |
| `email_logs` | Anti-duplicazione applicativa per email legate a booking |
| `email_settings` | Opt-out company-level configurabile dall'HR |
| `email_unsubscribe_tokens` | Token one-click unsubscribe per email |
| `suppressed_emails` | Email bloccate (unsubscribe, bounce, complaint) |
| `pgmq.auth_emails`, `pgmq.transactional_emails` | Code di invio (più rispettivi dead-letter) |

### 2.6 Analytics

| Tabella | Cosa è |
| --- | --- |
| `user_events` | Eventi significativi (login, view, decisione, prenotazione). Base per cruscotto super admin e dataset di automazione futura |

---

## 3. RLS — i pattern

Le policy concrete sono tante e cambiano. Quello che resta stabile sono i pattern. Le regole di prodotto da cui derivano stanno in `principi.md` §4.3.

**Helper functions.** Tutte `SECURITY DEFINER`, `STABLE`, con `SET search_path = public, pg_temp`. Sono il punto unico da cui le policy leggono l'identità: `has_role(user, role)`, `get_my_role()`, `is_super_admin(user)`, `is_admin(user)`, `is_association_admin(user)`, `get_user_company_id(user)`, `get_user_association_id(user)`. Le policy chiamano queste funzioni invece di leggere `profiles` o `user_roles` direttamente, per evitare ricorsioni RLS.

**Pattern HR.** Per qualsiasi tabella che contiene dati di una company, la policy SELECT per `hr_admin` filtra su `company_id = get_user_company_id(auth.uid())`. La UPDATE è generalmente assente: le scritture sensibili passano da RPC dedicate (vedi §4).

**Pattern ETS.** Stessa logica per `association_admin` su `association_id = get_user_association_id(auth.uid())`. Le esperienze di volontariato della propria ETS, le proprie città, i propri eventi TB nei verticali pertinenti.

**Pattern Super Admin.** `FOR ALL USING (has_role(auth.uid(), 'super_admin'))`. Una policy unica per ogni tabella, mai segmentata.

**Pattern Dipendente.** Vede solo i propri dati (`id = auth.uid()` o `user_id = auth.uid()`) e le esperienze pubblicate per la propria company tramite `experience_companies`.

**REVOKE column-level su dati sensibili.** Quando una colonna contiene un dato che deve restare invisibile a un ruolo (margini ETS, prezzi ETS, costi interni), la protezione passa da `REVOKE SELECT (colonna) ON tabella FROM authenticated`, non da un filtro nella query. La RPC SECURITY DEFINER può comunque leggere la colonna perché gira come owner. Pattern applicato su `tb_quotes.bravo_margin_*`, `tb_quotes.total_amount_ets`, `tb_quote_items.unit_price_ets`, `tb_quote_items.total_ets`, `tb_quote_items.association_id`, `tb_quote_items.proposal_id`.

**Trigger DB di consistenza esclusività.** Quando un invariante di dominio non è esprimibile come RLS (es. "se l'esperienza è `private`, può esserci al più 1 azienda nel bridge"), si usa un trigger BEFORE come ultimo livello di difesa. Caso vivo: `public.enforce_private_experience_single_company()` con due trigger gemelli — `enforce_private_single_company_on_bridge` (BEFORE INSERT su `experience_companies`) e `enforce_private_single_company_on_experiences` (BEFORE UPDATE OF visibility su `experiences`) — garantiscono che `visibility = 'private'` ⇔ al più 1 riga nel bridge. La sequenza di salvataggio lato UI (DELETE bridge → UPDATE visibility → INSERT bridge) è progettata per rispettare il trigger.

**Regola di evoluzione.** Aggiungere policy nuove prima di rimuovere quelle vecchie (le RLS sono OR-evaluated, allargare è sempre sicuro, restringere è un punto di non ritorno). Mai DROP+CREATE nello stesso step. Dettagli operativi in `CLAUDE.md`.

---

## 4. RPC critiche

Tutte le RPC sensibili seguono lo stesso pattern: `SECURITY DEFINER`, `SET search_path = public, pg_temp`, autorizzazione esplicita in cima al corpo (check ruolo + check ownership), `REVOKE EXECUTE FROM PUBLIC` + `GRANT EXECUTE TO authenticated`. Le scritture passano da RPC, non da INSERT/UPDATE diretti dal client.

### Identità e accesso

| RPC | Cosa fa |
| --- | --- |
| `has_role`, `get_my_role`, `get_user_role` | Lettura ruolo corrente |
| `is_super_admin`, `is_admin`, `is_association_admin` | Wrapper booleani usati nelle policy |
| `get_user_company_id`, `get_user_association_id` | Lookup company/association del profilo |
| `admin_set_user_role` | Cambio ruolo (solo super admin, single-role model) |
| `validate_access_code`, `increment_access_code_usage` | Validazione codice in registrazione |

### Volontariato

| RPC | Cosa fa |
| --- | --- |
| `is_booking_cancellable` | Una prenotazione si può ancora cancellare? |
| `is_experience_date_available` | Posti residui su una data |
| `get_confirmed_bookings_count` | Conteggio prenotazioni confermate per data |
| `hr_has_historical_booking_for_date` | Usata in flussi di visibilità storica |

### Team Building — HR

| RPC | Cosa fa |
| --- | --- |
| `get_tb_quote_for_hr` | Legge la quote attiva di una request, escludendo i campi sensibili |
| `get_tb_quote_items_for_hr` | Legge le voci della quote, solo colonne `unit_price_final` / `total_final` |
| `hr_decide_on_quote` | Unica via per accettare / rifiutare / chiedere modifiche su una quote |

### Team Building — Super Admin

| RPC | Cosa fa |
| --- | --- |
| `get_tb_quote_full_for_admin`, `get_tb_quote_items_full_for_admin` | Lettura completa con margini e prezzi ETS |
| `get_tb_quote_history_for_admin` | Tutte le versioni di una quote, anche `superseded` |
| `admin_save_tb_quote_draft` | Salvataggio bozza preventivo (DELETE/INSERT items in transazione) |
| `admin_send_tb_quote` | Transizione `draft` → `sent` con advisory lock |
| `admin_supersede_and_create_new_version` | Versioning su `modification_requested` |
| `get_tb_request_status_log_for_admin` | Audit cronologia stati di una request |
| `match_tb_formats_for_request` | Matching catalogo per una richiesta |

### Email

| RPC | Cosa fa |
| --- | --- |
| `enqueue_email` | Inserimento in coda pgmq, auto-creazione coda se assente |
| `read_email_batch` | Lettura batch dalla coda per il worker |
| `move_to_dlq` | Spostamento messaggio nella dead-letter queue |

---

## 5. Edge function attive

Tutte in `supabase/functions/`. Convenzione: `verify_jwt = false` con autenticazione fatta a mano leggendo `Authorization`, eccetto `process-email-queue` che usa `verify_jwt = true` + check esplicito `role = 'service_role'`.

| Function | Cosa fa |
| --- | --- |
| `send-transactional-email` | Dispatcher unico verso il provider. Le wrapper la invocano server-to-server. Mai chiamata dal browser |
| `process-email-queue` | Worker che consuma `pgmq`, gestisce retry e rate-limit. Trigger da `pg_cron` ogni 5 secondi |
| `send-booking-confirmation` | Wrapper: conferma prenotazione (trigger client-side dopo INSERT su `bookings`) |
| `send-booking-reminders` | Wrapper: reminder pre-evento, batch da `pg_cron` |
| `send-feedback-request` | Wrapper: richiesta feedback post-evento |
| `auth-email-hook` | Hook Supabase Auth per personalizzare email di sistema |
| `submit-access-request` | Endpoint pubblico per la landing (lead in ingresso → `access_requests`) |
| `handle-email-unsubscribe` | Gestione one-click unsubscribe (token → riga in `suppressed_emails`) |
| `handle-email-suppression` | Webhook bounce/complaint dal provider |
| `preview-transactional-email` | Utility super admin per anteprima template |

Pattern e regole per aggiungere una nuova email: `transactional-emails.md`.

---

## 6. Pagine principali per ruolo

Le route sono protette da componenti dedicati: `ProtectedRoute` (dipendente loggato), `ProtectedHRRoute`, `ProtectedSuperAdminRoute`, `ProtectedAssociationRoute`. La protezione è UI-side; la vera sicurezza sui dati è RLS + RPC.

### Pubbliche / Auth

`/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/unsubscribe`

### Dipendente — `/app/*`

| Route | Cosa è |
| --- | --- |
| `/app/experiences` | Catalogo esperienze pubblicate per la propria company |
| `/app/experiences/:id` | Dettaglio esperienza + scelta data e prenotazione |
| `/app/bookings` | Le proprie prenotazioni |
| `/app/impact` | Le proprie ore e impatto |
| `/app/profile` | Profilo personale |

### HR — `/hr/*`

| Route | Cosa è |
| --- | --- |
| `/hr` | Home dashboard contestuale |
| `/hr/volontariato` | Vista unica del programma volontariato attivato per l'azienda (HR read-only, curation lato super-admin) |
| `/hr/experiences/:id` | Dettaglio esperienza in chiave HR |
| `/hr/users` | Dipendenti registrati della propria company |
| `/hr/report` | Dashboard report (esistente, evolverà) |
| `/hr/team-building` | Case list richieste TB della propria company |
| `/hr/team-building/nuova-richiesta` | Wizard brief |
| `/hr/team-building/:id` | Dettaglio richiesta con grid proposte e preventivo |
| `/hr/team-building/:id/proposte/:proposalId` | Dettaglio singola proposta |
| `/hr/impostazioni/*` | Profilo, sicurezza, tema, generali, membri, volontariato |

Placeholder attivi: `/hr/formazione`, `/hr/negozio`, `/hr/convenzioni`, `/hr/calendario`, `/hr/galleria`, `/hr/comunicazione` (componente `HRPlaceholderPage`, riempiremo in roadmap).

### Super Admin — `/super-admin/*`

| Route | Cosa è |
| --- | --- |
| `/super-admin` | Dashboard |
| `/super-admin/companies` | Anagrafica aziende clienti |
| `/super-admin/users` | Tutti i profili, con cambio ruolo |
| `/super-admin/associations` | Anagrafica ETS |
| `/super-admin/cities`, `/super-admin/categories` | Anagrafiche di dominio |
| `/super-admin/experiences` | Gestione esperienze volontariato |
| `/super-admin/team-building/formats`, `/.../formats/:id` | Catalogo TB |
| `/super-admin/team-building/richieste`, `/.../richieste/:id` | Workspace richieste TB |
| `/super-admin/access-codes`, `/super-admin/access-requests` | Codici di registrazione e lead |
| `/super-admin/email-settings` | Gate company-level email |
| `/super-admin/impostazioni/*` | Profilo, sicurezza |

### Association — `/association/*`

| Route | Cosa è |
| --- | --- |
| `/association` | Home |
| `/association/experiences`, `/.../experiences/:id` | Gestione esperienze della propria ETS |
| `/association/history` | Storico attività erogate |
| `/association/calendar` | Calendario operativo |
| `/association/profile` | Profilo pubblico ETS (visibile alle aziende) |
| `/association/impostazioni/*` | Profilo, sicurezza, organizzazione |

Placeholder attivi: `/association/team-building`, `/association/formazione`, `/association/negozio`, `/association/convenzioni`.

---

## 7. Pattern di codice e convenzioni

**Data fetching.** TanStack Query come standard. Convenzioni complete in `data-fetching.md`. Hook custom in `src/hooks/queries/*`. Factory delle queryKey per evitare drift.

**Form.** Per form complessi (es. preventivo, brief TB), `react-hook-form` + `zod` + `zodResolver`. Pattern di riferimento: `QuoteEditor` con `useFieldArray`, validazione live tramite `useWatch`, schema doppio (`draftSchema` permissivo + `sendSchema` stretto).

**Email.** Wrapper edge function per ogni tipo, template React Email registrati in `registry.ts`. `idempotencyKey` derivato dall'evento univoco (mai timestamp o random). Dettagli in `transactional-emails.md`.

**UI primitive.** `shadcn/ui`. Token, tipografia, pattern in `design-system.md`. Date con `date-fns` e locale `it`.

**Convenzione linguistica.** Italiano nella UI, inglese negli identifier DB (nomi tabelle, colonne, enum, valori di stato). Mai mescolare nei nuovi sviluppi.

**Migrazioni SQL.** Mai DROP+CREATE nello stesso step. Regole in `CLAUDE.md`.

---

## 8. Come si usa questo documento

Quando si **aggiunge un verticale nuovo**: si verifica nella §2 dove vanno le nuove tabelle (rispettando gli oggetti dominio condivisi), nella §3 quali pattern RLS si applicano, nella §4 quali RPC servono, nella §6 quali pagine aggiungere per ogni ruolo.

Quando si **fa debug "perché non posso leggere X"**: §3 per i pattern RLS, e soprattutto controllare se la colonna ha un `REVOKE` column-level (caso più frequente sui dati sensibili TB).

Quando si **aggiunge un'email**: §5 per il pattern wrapper, poi `transactional-emails.md` per i passi concreti.

Quando si **modifica schema, RLS, RPC o edge function**: a fine sessione si aggiorna questo file insieme a `log.md`. Se non è aggiornato, smette di essere bussola.