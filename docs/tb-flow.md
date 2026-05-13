# Team Building — Flusso e modello dati

> Documento di riferimento per il verticale Team Building su Bravo!.
> Versione: maggio 2026.
> Riscritto da capo dopo il consolidamento del modello "bacheca accumulativa" (vedi sezione 2).

---

## 1. Cosa è cambiato rispetto alla versione precedente

La prima versione di questo documento modellava il flusso TB come una **sequenza di 8 fasi lineari**, con uno stato granulare su `tb_requests.status` (15 valori) che orchestrava email, RLS, transizioni operative.

Funzionava finché ogni richiesta aveva al massimo una quote attiva. Quando abbiamo deciso che ogni `tb_proposal` interessata deve avere il **suo preventivo separato** — perché le proposte sono alternative tra loro, non un carrello — il modello a fase singola si è rotto: se la proposta A è in fase "preventivo inviato" e la proposta B è in "preventivo in composizione", quale stato dai alla richiesta?

La risposta che adottiamo è: nessuno. Lo stato della richiesta torna a essere semplice (4 valori: `open`, `confirmed`, `completed`, `cancelled`), e gli stati operativi vivono sulle entità giuste — proposte e preventivi. La pratica diventa una bacheca accumulativa in cui proposte e preventivi si aggiungono nel tempo, non un workflow che avanza per fasi chiuse.

---

## 2. I tre principi che reggono il modello

**Il brief è un'ipotesi, non un contratto.** L'HR può modificare il brief in qualsiasi momento finché la pratica è aperta — anche la tipologia di attività. Il brief esprime un intento generale di partenza, non specifiche fisse. È legittimo che HR scopra strada facendo cosa vuole davvero, ed è legittimo che Bravo! (o un'AI futura) proponga format diversi da quelli indicati se servono meglio all'obiettivo.

**La pratica accumula, non resetta.** Proposte e preventivi si aggiungono nel tempo. HR può cambiare idea su una proposta più volte. Il super admin può aggiungere nuove proposte in qualsiasi momento. Niente di quello che è stato fatto si distrugge automaticamente: o lo si conserva, o lo si chiude esplicitamente.

**C'è un solo punto di chiusura: l'accettazione di un preventivo.** Tutto il resto è esplorazione. Quando HR accetta una quote, le altre quote attive vengono cancellate, la pratica passa a `confirmed`, e la pagina cambia faccia perché ora c'è un evento da organizzare. L'annullamento esplicito della richiesta è l'altra via di uscita.

---

## 3. Schema dati — entità centrali

Le entità descritte sotto sono quelle su cui abbiamo chiarezza piena dopo le sessioni di consolidamento. Le altre entità del verticale TB (eventi, partecipanti, contratti, log decisioni di matching) esistono nel sistema attuale e vanno mantenute, ma richiedono una sessione dedicata di revisione prima di essere formalizzate qui. Vedi sezione 3.5.

### 3.1 `tb_formats` — il catalogo

Una riga per ogni format proponibile (Cooking Class, Dragon Boat, Cartapesta, ecc.).

Campi rilevanti:

- `id`, `title`, `description`, `short_description`, `image_url`
- `category_id` (FK a `categories`, le stesse del volontariato)
- `association_id` nullable — se valorizzato, ETS predefinita per questo format. Se null, il super admin sceglie l'ETS caso per caso al momento di creare la proposta.
- `participants_min`, `participants_max`, `duration_hours`
- `location_type` (`indoor` / `outdoor` / `both`)
- `sdgs`, `secondary_tags`
- `status` (`draft` / `published` / `archived`)
- `format_services` JSONB (cosa è incluso nel format)

Tabella ponte `tb_format_associations` per il caso di ETS multiple associabili a un format.

Catalogo visibile a super admin e agli ETS che vi figurano come erogatori. **HR non vede il catalogo direttamente**: vede solo le `tb_proposals` che il super admin costruisce per la sua richiesta.

### 3.2 `tb_requests` — la pratica

Una riga per ogni richiesta di team building aperta da HR.

Campi:

- `id`, `company_id`, `created_by`, `title`
- Campi del brief, **tutti modificabili finché `state = open`**:
  - `participants_min`, `participants_max` (calcolati da un singolo numero ±10%)
  - `preferred_period_from`, `preferred_period_to`
  - `budget_estimate`
  - `extra_services` JSONB (`{lunch, transport, location_rental, catering_social, places: [...], goals: [...], notes}`)
  - `preferred_category_id` (la tipologia di attività preferita — non vincolante, può cambiare)
  - `notes`
- `state` enum: `open` / `confirmed` / `completed` / `cancelled`
- `assigned_admin_id` nullable
- `created_at`, `updated_at`

**Drop rispetto al modello precedente:** il campo `status` con 15 valori e la tabella `tb_request_status_log`. La granularità operativa vive sulle entità giuste (`tb_proposals.client_status`, `tb_quotes.status`).

Transizioni di `state`:

- `open → confirmed`: HR accetta un preventivo
- `open → cancelled`: HR annulla la richiesta, oppure il super admin la chiude
- `confirmed → completed`: l'evento è avvenuto (chiusura post-evento)
- `confirmed → cancelled`: caso eccezionale, evento annullato dopo accettazione

Non sono previste transizioni inverse.

### 3.3 `tb_proposals` — le idee al cliente

Una riga per ogni format che il super admin propone a una specifica richiesta.

Campi:

- `id`, `tb_request_id`, `tb_format_id`
- `override_association_id` nullable: se il format ha `association_id` null, qui si specifica l'ETS scelta per questa proposta. Se valorizzato, prevale.
- `priority` per ordine di visualizzazione
- `admin_notes`: note che il super admin vuole comunicare a HR su questa proposta
- `client_status` enum: `pending` / `interested` / `declined`. Reversibile finché `state = open`.
- `client_decision_at`
- `is_active` boolean (default `true`): se `false`, la proposta è ritirata dal super admin e non viene mostrata ad HR. Usato per pulire proposte non più adatte dopo una modifica significativa del brief, senza eliminarle.
- `association_visibility` enum (`visible` / `hidden`): controllo granulare sulla visibilità del nome ETS in questa proposta
- `created_at`, `updated_at`

### 3.4 `tb_quotes` + `tb_quote_items` — i preventivi

Una quote per ogni `tb_proposal` interessata per cui HR ha richiesto un preventivo. **Le quote sono per-proposal, non per-request.**

Campi `tb_quotes`:

- `id`, `request_id`, `proposal_id` (**non nullable**)
- `version` (per gestire successive versioni in caso di modifiche richieste)
- `status` enum: `draft` / `sent` / `viewed` / `accepted` / `rejected` / `modification_requested` / `superseded` / `cancelled`
- `total_amount_ets`, `total_amount_final`, `bravo_margin_amount`, `bravo_margin_percent`
- `terms_text`, `pdf_url` (in V1 generato manualmente, in V2 da template)
- `client_decision_notes`
- `sent_at`, `viewed_at`, `decided_at`
- `created_by`, `created_at`, `updated_at`

**Drop rispetto al modello precedente:** il campo `valid_until`. La scadenza temporale di un preventivo è un concetto fragile per HR (la vera scadenza è la data dell'evento). Se il super admin ha bisogno di tracciare un orizzonte di validità interna, lo fa nelle note operative del caso.

Vincolo: una sola quote in stato `draft`/`sent`/`viewed` per ogni `(request_id, proposal_id)`. Storico delle versioni precedenti gestito tramite `superseded`.

`tb_quote_items` resta come oggi (descrizione, quantità, prezzo unitario ETS, prezzo finale cliente, totali per riga, note).

### 3.5 Entità da revisionare in sessione dedicata

Le seguenti entità esistono nel sistema attuale e vanno mantenute, ma la loro forma definitiva per V1 richiede una sessione di lavoro a parte. Quando ci arriveremo, aggiorneremo qui.

- `tb_events` — l'evento confermato, con data, location, link pubblico di iscrizione, stato operativo dell'evento.
- `tb_event_participants` — gli iscritti raccolti via link pubblico.
- `tb_contracts` — il contratto associato al preventivo accettato (in V1 firma manuale esterna).
- `tb_matching_decisions` — log append-only delle decisioni di matching (super admin e cliente), utile per analytics e training futuro AI.

---

## 4. Le azioni del sistema

### 4.1 Azioni HR (disponibili finché `tb_requests.state = open`)

1. **Modificare il brief** (qualsiasi campo). Notifica al super admin con diff dei campi cambiati.
2. **Cambiare il `client_status` di una proposta** (pending ↔ interested ↔ declined). Reversibile.
3. **Richiedere un preventivo** per una proposta `interested` (crea `tb_quote` in `draft`, notifica super admin).
4. **Decidere su un preventivo** ricevuto: accetta / rifiuta / chiedi modifica.
5. **Annullare la richiesta** (passa a `cancelled`).

L'accettazione di un preventivo è l'unica azione con effetti distruttivi:

- La quote accettata passa a `accepted`.
- Tutte le altre quote attive (`draft`, `sent`, `viewed`, `modification_requested`) della stessa request passano a `cancelled` con motivo "preventivo alternativo accettato".
- `tb_requests.state` passa a `confirmed`.
- Viene creata una riga `tb_events` (struttura da definire in sessione dedicata).

### 4.2 Azioni super admin

1. **Aggiungere proposte** a una richiesta (in qualsiasi momento finché `state = open`).
2. **Disattivare una proposta** non più adatta (`is_active = false`). Tipico dopo una modifica significativa del brief.
3. **Comporre/inviare un preventivo** per una proposta `interested` che ha ricevuto richiesta da HR.
4. **Gestire le modifiche richieste**: crea una nuova versione della quote (`version + 1`, vecchia in `superseded`).
5. **Cancellare un preventivo** se necessario.
6. **Caricare il contratto firmato**, confermare data e dettagli dell'evento, marcare l'evento come completed — dettagli operativi in sessione dedicata (sez. 3.5).

### 4.3 Trigger di sistema in V1: contatto con il team Bravo!

Quando HR scarta una proposta, l'app mostra un messaggio contestuale: "Vuoi che il team Bravo! ti proponga un'alternativa?". Click sì → notifica al super admin "Cliente ha scartato X e chiede un'alternativa". Super admin entra, aggiunge nuove proposte.

In V1 questo è il flusso. Niente proposte automatiche, perché la qualità del matching richiede criteri qualitativi che oggi non sono nel DB (relazioni con ETS specifici, conoscenza pregressa del cliente, stagionalità, ecc.). Affidarsi a un matching solo quantitativo in fase di traction rischia di danneggiare la qualità percepita del servizio.

Tutte le decisioni e le interazioni vengono comunque loggate in `tb_matching_decisions` e in `user_events`, perché stiamo costruendo il dataset che alimenterà l'automazione futura.

### 4.4 Orizzonte di automazione e AI

Direzione strategica chiara: le azioni di super admin descritte in 4.2 devono diventare progressivamente automatiche. Le tappe ragionevoli, da affinare quando ci arriveremo:

- **V1.5** — assistenza al super admin: quando entra su una richiesta, vede in pre-filtro i format del catalogo che matchano i parametri quantitativi (budget, città, partecipanti, periodo). Conferma con un click. Stesso meccanismo per "Brief modificato → ecco le proposte vecchie che potrebbero non essere più coerenti".
- **V2** — automazione vera per casi a basso rischio: il nudge per le alternative dopo uno scarto può proporre direttamente la migliore corrispondenza dal catalogo. Per casi complessi resta sempre disponibile il fallback umano "Contatta il team".
- **V3** — AI con fine-tuning sulle decisioni storiche raccolte in `tb_matching_decisions`.

Il bottone "Contatta il team Bravo!" resta come opzione di backup in tutte le evoluzioni: ci sono sempre casi che richiedono giudizio umano.

### 4.5 Modifica del brief: effetti in V1

Modificare il brief è un'azione leggera che non distrugge nulla. Le proposte esistenti restano, ma:

- Il super admin riceve notifica con il diff dei campi cambiati.
- Sta al super admin valutare se alcune proposte vecchie sono ora irrilevanti rispetto al nuovo brief, e marcarle `is_active = false`. Niente automatismi in V1.
- Sta al super admin aggiungere nuove proposte coerenti con il brief aggiornato.

HR vede solo le proposte `is_active = true`. Le altre restano nel sistema ma sparite alla sua vista.

L'automazione di questo flusso (es. "modifica brief → sistema suggerisce proposte da disattivare → super admin valida con un click") è prevista in V1.5 secondo le tappe di sez. 4.4.

---

## 5. UI lato HR

### 5.1 Lista richieste `/hr/team-building`

La pagina raggruppa le richieste in **tre sezioni**, nell'ordine di importanza per HR:

1. **Eventi in programma** — `state = confirmed`. Le richieste con un preventivo accettato e un evento in organizzazione. È la zona dove HR ha attenzione attiva: data definita, partecipanti da gestire, evento da seguire.
2. **Richieste in corso** — `state = open`. Le pratiche ancora in fase di brief/proposte/preventivi. È la zona delle decisioni da prendere.
3. **Archivio** — `state = completed` + `state = cancelled`. Eventi passati e richieste annullate. Sezione collassata di default, riapribile con click.

Ogni sezione è una `StatusSection` (icona colorata + titolo + count) seguita da una grid responsive di `BravoCard` quadrate — lo stesso pattern già consolidato in `/association/experiences`. Layout responsive: 2 colonne su mobile, 3 su tablet, 4 su desktop standard, 5 su desktop largo.

#### Anatomia delle card

**Card "Evento in programma"** (`confirmed`):

- Immagine del format scelto (da `tb_formats.image_url`).
- **Badge data in overlay** sull'immagine in alto a sinistra (mese abbreviato + giorno), riusando il pattern di `BookingCard.tsx`.
- Titolo: `tb_requests.title` (dato da HR all'avvio della pratica).
- Meta riga: nome del format · numero partecipanti target.
- Nessuna pill di stato. Nessuna CTA esplicita: click sulla card apre il dettaglio.

**Card "Richiesta in corso"** (`open`):

- Niente immagine del format (non c'è ancora un format scelto). Placeholder con sfondo tonale chiaro e icona Tabler legata alla `preferred_category_id` del brief (es. ambiente → foglia, gastronomia → utensile cucina). Se la categoria non è valorizzata, sfondo neutro con icona generica.
- Titolo: `tb_requests.title`.
- **Pill di stato** (vedi tabella sotto), colorata in base al fatto che ci sia o no azione HR richiesta.
- Meta riga: periodo preferito · numero partecipanti target.
- Nessuna CTA esplicita: click sulla card apre il dettaglio.

**Card "Archivio"** (`completed` / `cancelled`):

- Immagine del format (per i completati). Per gli annullati senza format scelto: placeholder come sopra.
- Card resa con `dimmed = true` (prop già supportato da `BravoCard`).
- Titolo: `tb_requests.title`.
- Badge esito: "Completato" / "Annullata".
- Meta riga: data evento (se completato) o data annullamento, format nome.
- Nessuna CTA esplicita.

#### Logica della pill di stato (solo `state = open`)

Quattro stati valutati top-down — la prima condizione vera determina la pill mostrata. Una sola pill per card, mai sovrapposizioni.

| Pill                      | Condizione                                                             | Tono                     |
| ------------------------- | ---------------------------------------------------------------------- | ------------------------ |
| Preventivo da decidere    | esiste `tb_quote` in `sent` o `viewed`                                 | ambra (azione richiesta) |
| N proposte da valutare    | esistono `tb_proposals` con `is_active=true` e `client_status=pending` | ambra (azione richiesta) |
| Preventivo in lavorazione | esiste `tb_quote` in `draft` o `modification_requested`                | grigio (in attesa)       |
| Proposte in arrivo        | fallback                                                               | grigio (in attesa)       |

La gerarchia riflette il principio del sistema: il preventivo da decidere è l'azione più "pesante" (potenzialmente distruttiva nelle altre quote attive) e merita priorità visiva sopra le altre.

#### Ordinamento

Dentro ogni sezione:

- **Eventi in programma**: per `tb_events.event_date` ascendente — il più imminente in cima.
- **Richieste in corso**: per `tb_requests.preferred_period_from` ascendente — quelle con evento previsto più vicino in cima. La pill colorata si occupa di richiamare visivamente l'attenzione sulle richieste che richiedono azione, senza bisogno di spostare le card.
- **Archivio**: per data ultima attività discendente — la più recente in cima.

#### Comportamento azioni

Le card non hanno alcuna azione rapida diretta. Tutto si fa dal dettaglio: click sulla card → apertura di `/hr/team-building/:id`. Questa scelta riduce drasticamente il rischio di azioni accidentali (l'accettazione di un preventivo, in particolare, è l'unica azione distruttiva del sistema e deve sempre avvenire dal contesto pieno).

#### Empty state

Se HR non ha mai aperto una richiesta TB, la pagina mostra lo stato vuoto attuale (titolo motivazionale + CTA "Inizia ora"). Il design dell'empty state non cambia in questa revisione.

#### Componenti riutilizzati

- `BravoCard` (`src/components/common/BravoCard.tsx`)
- `StatusSection` (lo stesso wrapper usato in `AssociationExperiencesPage.tsx`)
- `BaseCardImage` per le immagini con fallback
- Pattern `imageOverlay` per il badge data, identico a `BookingCard.tsx`

#### Componenti da deprecare

Con questa riprogettazione, i componenti `ActiveCard` e `HistoryCard` presenti oggi in `HRTeamBuildingPage.tsx` non sono più necessari e vanno rimossi. Il file `team-building-nuova-interfaccia.md` (documento di design dello stato precedente) va archiviato per coerenza.

### 5.2 Dettaglio richiesta `/hr/team-building/:id`

Layout a due colonne, ispirato al pattern usato da Attio per i record.

**Pannello sinistro (≈ 28% larghezza), sempre visibile, identico per ogni stato:**

- Titolo richiesta + badge state
- Brief riepilogativo compatto (partecipanti, periodo, budget, places, tipologia, note)
- Azione "Modifica brief" → apre dialog/sheet di editing completo (disabilitato se `state ≠ open`)
- Eventuali azioni di pratica: "Annulla richiesta" (solo se `state = open`)

**Pannello destro (≈ 72% larghezza), tab navigation in alto.**

Tab attive in `state = open` — struttura consolidata:

- **Proposte** — grid card delle proposte `is_active = true`. Filtri: tutte / pending / interessate / scartate. Quick action Mi interessa / Scarta. Dopo lo scarto si attiva il messaggio "Vuoi che il team Bravo! ti proponga un'alternativa?" (sez. 4.3). Una sezione "Scartate" collassata in fondo per chi vuole rivedere.
- **Quotazioni** — una card per ogni proposta `interested`, con lo stato del preventivo associato:
  - Nessuno → CTA "Richiedi preventivo"
  - "Preventivo in preparazione"
  - "Preventivo pronto" → CTA "Visualizza"
  - "Preventivo rifiutato" → testo neutro
  - (Accetta da qui fa scattare la transizione a `confirmed`)

Tab attive in `state = confirmed` — **struttura in lavorazione**, contenuti macro definiti ma forma interna da affinare in sessione dedicata quando ci arriveremo:

- **Proposte** (sola lettura, mostra quelle valutate)
- **Quotazioni** (sola lettura, evidenzia quella accettata)
- **Evento** — riepilogo del format confermato. Da disegnare quando arriviamo all'implementazione.
- **Partecipanti** — gestione inviti, iscrizioni, consensi, comunicazioni. Da disegnare quando arriviamo all'implementazione.
- **Documenti** — preventivo accettato, contratto firmato, materiali. Da disegnare quando arriviamo all'implementazione.

Tab aggiunta in `state = completed` — anch'essa da affinare:

- **Feedback** — sondaggio post-evento, eventuale NPS, raccolta testimonianze. Da disegnare.

**Default tab logic** all'apertura della pagina:

1. Se ci sono preventivi nuovi non visti → **Quotazioni**
2. Altrimenti se ci sono proposte `pending` → **Proposte**
3. Altrimenti se `state = confirmed` → **Evento**
4. Altrimenti prima tab disponibile

### 5.3 Mobile

V1 è desktop-only nel pattern a due colonne. HR userà la pagina TB principalmente da computer. La versione mobile verrà disegnata in V2.

---

## 6. UI lato super admin

L'attuale `/super-admin/team-building/richieste/{id}` (vedi `src/pages/super-admin/TBRequestDetailPage.tsx`) va aggiornata per coerenza con il nuovo modello: drop degli stati granulari come driver di vista, gestione delle quote per-proposal, supporto per `is_active`. La forma esatta della UI super admin in V1 va affinata insieme all'implementazione, perché impatta meno sull'esperienza cliente.

Catalogo TB (`/super-admin/team-building/formats`) resta come oggi.

---

## 7. UI lato ETS

V1: ETS riceve email di richiesta quotazione e risponde via mail a `team@bravoapp.it`. Nessuna UI dedicata in app.

V2: pannello dedicato — struttura da definire quando ci arriveremo.

---

## 8. Pagina pubblica iscrizione partecipanti

`/iscrizione-evento/{slug}` — pagina pubblica senza login per i partecipanti, con form minimo (nome, email, privacy obbligatoria, intolleranze condizionali). Struttura sostanzialmente come oggi, da rivedere insieme a `tb_events` e `tb_event_participants` in sessione dedicata.

---

## 9. Email e notifiche

Le email non sono più triggerate da transizioni di `tb_requests.status` (droppato), ma da eventi atomici sulle entità giuste.

Lista preliminare degli eventi da coprire in V1, da consolidare insieme all'implementazione delle edge function:

- Creazione di una `tb_request` → super admin
- Modifica del brief → super admin (con diff)
- Aggiunta di una proposta → HR
- Scarto di una proposta con richiesta alternativa → super admin
- Richiesta preventivo da HR per una proposta → super admin
- Richiesta quotazione ETS (struttura come oggi) → ETS
- Invio preventivo (tb_quote → sent) → HR
- Decisione cliente (accept / reject / modification) → super admin
- Conferma data evento → HR
- Reminder partecipante (giorno prima) → partecipanti
- Evento completato → HR (eventuale link a tab Feedback)

Notifiche in-app speculari, idempotenti.

---

## 10. Analytics

Eventi essenziali V1 in `user_events`, da consolidare quando implementiamo:

- Eventi sulla richiesta: started, submitted, brief_updated
- Eventi sulle proposte: viewed, marked_interested, declined, alternative_requested
- Eventi sulle quote: requested, viewed, accepted, rejected, modification_requested
- Eventi sull'evento: participant_registered, completed
- Eventi sul feedback: submitted

Cruscotto super admin `/super-admin/analytics/aziende-tb`: stato corrente di ogni azienda, alert per soglie. Forma esatta da definire dopo aver visto i primi dati reali.

---

## 11. V1 / V2 / V3

**V1 — focus dell'implementazione attuale:**

- Schema dati delle entità centrali (sez. 3.1–3.4) come descritto
- Mantenimento delle entità di esecuzione esistenti (sez. 3.5), da revisionare quando arriveremo all'implementazione delle relative tab
- Gestione proposte HR e super admin, incluso `is_active` e richiesta manuale di alternative
- Gestione preventivi per-proposal
- Vista HR `/hr/team-building/:id` con layout a due colonne, tab consolidate in `state = open`
- Vista lista richieste `/hr/team-building` con struttura definita in sez. 5.1
- Tab `state = confirmed` con struttura macro confermata, forma interna da disegnare
- Email e analytics base
- Migrazione DB descritta in sez. 12

**V1.5 — assistenza al super admin:**

- Pre-filtro automatico del catalogo per il super admin nella scelta proposte
- Suggerimenti automatici di proposte da disattivare dopo modifica brief
- Lista richieste rifinita con i learning dei primi mesi
- UI super admin rifinita

**V2 — automazione e ETS in app:**

- Pannello ETS per quotazioni e gestione eventi
- Firma `click_in_app`
- Generazione automatica PDF preventivo
- Automazione del nudge alternative per casi a basso rischio
- Versione mobile della pagina TB

**V3 — AI matching:**

- Modello di scoring sulle decisioni storiche
- Proposte automatiche di qualità per casi anche complessi
- Eventuale integrazione fatturazione elettronica

### 11.1 Ordine di implementazione

1. DB additivo minimo per la lista
   - Migration: ADD COLUMN tb_requests.state (GENERATED da status)
   - Migration: ADD COLUMN tb_proposals.is_active (default true)

2. Lista HR /hr/team-building
   - Refactor di HRTeamBuildingPage.tsx con BravoCard + StatusSection
   - Rimozione di ActiveCard e HistoryCard
   - Archiviazione di team-building-nuova-interfaccia.md

3. Resto del DB additivo (Fase 1 completa, sez. 12 step 1)
   - Validazione tb_quotes.proposal_id non null
   - Nuove RPC: hr_request_alternative_for_proposal, hr_update_brief, admin_deactivate_proposal
   - Refactor RPC esistenti: chiave (request_id, proposal_id) invece di (request_id)

4. Super admin workspace
   - Refactor /super-admin/team-building/richieste/{id} al modello accumulativo
   - Quote per-proposal in UI
   - Toggle is_active operativo
   - Aggiunta proposte in qualsiasi momento

5. Dettaglio HR /hr/team-building/:id (state = open)
   - Layout a due colonne
   - Tab Proposte con nudge alternative
   - Tab Quotazioni con card per-proposal
   - Modifica brief in qualsiasi momento

6. Email refactor
   - Trigger sui nuovi eventi atomici delle entità giuste
   - Drop dei trigger basati sulle transizioni di status

7. Cleanup DB
   - Conversione di state da GENERATED a colonna regolare
   - DROP tb_requests.status, tb_request_status_log, tb_quotes.valid_until
   - Drop RPC vecchie e vincoli obsoleti

Cantiere parallelo (non blocca il resto):

- Sessione dedicata: entità di esecuzione (tb_events, partecipanti, contratti, matching_decisions)
- Tab Evento, Partecipanti, Documenti, Feedback (state = confirmed / completed)

## 12. Migrazione DB

La migrazione del modello attuale al nuovo richiede una sequenza ordinata di step, ognuno una migration separata, seguendo la regola **"aggiungi prima, rimuovi dopo"**.

Sequenza ad alto livello (i singoli step DDL e RPC vanno scritti come Claude Code task dedicati):

1. **Aggiunta dei nuovi campi** senza toccare i vecchi:
   - `tb_requests.state` (enum nuovo, popolato in base allo `status` corrente)
   - `tb_proposals.is_active` (default true per tutte le righe esistenti)
   - `tb_quotes.proposal_id` reso effettivamente vincolante (oggi nullable in alcuni casi, da consolidare)

2. **Aggiornamento delle RPC**:
   - `admin_save_tb_quote_draft`, `admin_send_tb_quote`, `hr_decide_on_quote`, `admin_supersede_and_create_new_version`: passaggio da chiave `(request_id)` a `(request_id, proposal_id)`
   - Nuove RPC necessarie: `hr_request_alternative_for_proposal`, `hr_update_brief`, `admin_deactivate_proposal`

3. **Aggiornamento del frontend** per leggere `state` e ignorare `status`. Layout a due colonne sostituisce la vista verticale attuale.

4. **Aggiornamento delle email**: ricondurre i trigger agli eventi atomici sulle entità giuste.

5. **Pulizia** (solo dopo che V1 della nuova UI è in produzione e stabile):
   - Drop di `tb_requests.status`
   - Drop di `tb_request_status_log`
   - Drop di `tb_quotes.valid_until`
   - Drop dei vincoli obsoleti (es. `quote_already_exists` su `request_id`)

Mai DROP + CREATE nello stesso step, mai modifiche alle RLS senza prima aggiungere le nuove policy.

---

## 13. Catalogo storico

I CSV storici con i format TB pre-piattaforma vanno importati come catalogo iniziale di `tb_formats`. Il campo `association_names` del CSV viene matchato per nome con la tabella `associations` esistente per popolare `tb_format_associations`. Categorie del catalogo TB usano la stessa tabella `categories` del volontariato.

---

## Appendice — Termini di base

- **Request**: il caso aperto, la pratica TB di un'azienda.
- **Proposal**: una scheda di un format proposto da Bravo! a una specifica request.
- **Quote**: un preventivo collegato a una specifica proposal di una specifica request.
- **Event**: l'esecuzione concreta che nasce quando una quote viene accettata.

---

## Sessioni di lavoro da pianificare

Tracciamo qui i punti del documento che richiedono una sessione dedicata prima di essere completati:

- **Entità di esecuzione** (sez. 3.5): consolidare lo schema di `tb_events`, `tb_event_participants`, `tb_contracts`, `tb_matching_decisions` alla luce del nuovo modello.
- **Tab `state = confirmed`** (sez. 5.2): disegnare in dettaglio le tab Evento, Partecipanti, Documenti.
- **Tab `state = completed`** (sez. 5.2): disegnare in dettaglio la tab Feedback.
- **UI super admin** (sez. 6): aggiornare il workspace `/super-admin/team-building/richieste/{id}` al nuovo modello.
- **Email** (sez. 9): consolidare la lista finale dei template e i trigger esatti.
- **Analytics** (sez. 10): definire il cruscotto super admin dopo aver visto i primi dati reali.
