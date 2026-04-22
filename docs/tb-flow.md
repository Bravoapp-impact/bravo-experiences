# Team Building — Flusso di prodotto

*Documento di progettazione — Aprile 2026*

---

## Premessa

Questo documento guida la costruzione del verticale **Team Building** nell'app Bravo!. Si aggancia a `sistema-operativo.md`, di cui eredita attori, oggetti dominio condivisi, infrastrutture trasversali e principi di permessi. Qui descrive cosa è specifico del TB: schema dati, stati del flusso, UI, email, eventi analytics.

Il doc è la fonte di verità per il flusso dei team building sociali in app. Se in fase di costruzione emergono decisioni diverse, il doc va aggiornato prima di proseguire — non vale la pena avere documentazione che dice una cosa e codice che ne fa un'altra.

---

## 1. Scopo del verticale

Il TB digitalizza un processo che Bravo! oggi gestisce tra Canva, mail e call. Il dolore operativo è reale: un'unica persona (o due) tiene insieme brief del cliente, scouting ETS, proposte su Canva, negoziazione preventivi, firma, gestione evento. Ogni TB occupa ore di lavoro coordinativo. A volumi crescenti non scala.

Il verticale TB in Bravo! deve:

1. **Ridurre il tempo di produzione delle proposte**, spostando brief e matching da Canva all'app, con un catalogo strutturato di format e un filtro intelligente.
2. **Portare il preventivo dentro il prodotto**, come pagina brandizzata che il cliente vede e accetta, non PDF spedito via mail.
3. **Centralizzare la relazione con l'ETS**, in V1 ancora via email ma da template strutturati, in V2 dentro l'app con un pannello dedicato.
4. **Registrare ogni passaggio** per l'analytics di prodotto, così Bravo! vede in tempo reale dove il cliente si è fermato.
5. **Preparare il terreno all'automazione**, loggando le decisioni di matching oggi fatte a mano per poter addestrare uno scoring o un modello in futuro.

Non è un tool interno. È un pezzo del prodotto che HR, super admin e (in V2) ETS usano ciascuno nella propria interfaccia.

---

## 2. Gli attori nel TB

**HR.** Apre la richiesta di TB compilando un brief in app. Vede le proposte che Bravo! gli ha preparato, marca quelle che gli interessano. Riceve il preventivo in app, lo apre, lo accetta (o richiede modifiche, o rifiuta). Gestisce il post-vendita: condivide il link di iscrizione ai colleghi, vede gli iscritti in tempo reale, accede a template di comunicazione.

**Super Admin.** Riceve la richiesta, seleziona dal catalogo i format candidati, assegna a ciascuno l'ETS di riferimento, crea le proposte per il cliente. Quando il cliente si esprime, contatta le ETS delle proposte d'interesse (in V1 via mail template, in V2 via notifica in-app). Raccoglie i prezzi ETS, costruisce il preventivo in app aggiungendo il margine Bravo! e le voci accessorie. Invia il preventivo al cliente. Segue la firma. Orchestra l'esecuzione dell'evento. È l'unico che vede tutto: prezzo ETS, margine, prezzo finale.

**ETS.** In V1 è fuori dall'app. Riceve una mail strutturata da Bravo! con i dettagli della richiesta (data, numero partecipanti, format concordato, servizi extra), risponde via mail con prezzo e disponibilità. In V2 ha un pannello dentro l'app: vede le richieste di quotazione, risponde direttamente, e dopo la firma vede le informazioni dell'evento e degli iscritti. In V1 l'ETS esiste come riga nel DB (già è così), ma non interagisce con il prodotto TB.

**Dipendente.** Nel TB il dipendente compare solo nel post-vendita: vede la sua partecipazione all'evento via app, compila il form (privacy obbligatoria, intolleranze se è previsto pranzo), poi il giorno dell'evento partecipa. Non ha visibilità sul catalogo TB né sul preventivo. Il TB è un evento ponte-offerto dall'azienda, non un servizio che il dipendente sceglie.

---

## 3. Schema dati

Sei tabelle nuove, tutte con prefisso `tb_`. Nessuna tocca tabelle esistenti, nessuna rimpiazza oggetti del volontariato.

### 3.1 `tb_formats` — il catalogo

Rappresenta i **format di team building** che Bravo! può proporre. È l'equivalente concettuale di `experiences` ma separato, perché la logica è diversa (un format TB non è prenotabile in autonomia, non ha `experience_dates`, non ha prezzo fisso).

Campi principali:

- `id`, `title`, `description`, `image_url`
- `category_id` → riferimento a `categories` (trasversale al sistema)
- `association_id` → riferimento a `associations`, **nullable**. Alcuni format storici (es. "Cartapesta") sono "format Bravo!" che possiamo erogare con ETS diverse caso per caso. Altri sono legati a un'ETS specifica (es. "Dragon Boat con Navigli Clean Up")
- `available_associations` (tabella ponte `tb_format_associations`) → lista di ETS che possono erogare quel format quando `association_id` è null. Serve per il filtro di matching.
- `location_type` enum: `indoor`, `outdoor`, `both`
- `city_ids` (tabella ponte `tb_format_cities`) → città in cui il format è erogabile
- `activity_type` enum: `ambientale`, `sociale`, `artistica`, `sportiva`, `culinaria`, `manuale`, `altro` — serve per il filtro primario nel matching. Simile ai tag secondari delle `experience`.
- `participants_min`, `participants_max` — range indicativo di pax sostenibile
- `duration_hours` — durata indicativa
- `price_range_min`, `price_range_max` — **a titolo indicativo**, non è il prezzo effettivo che si applica al cliente. Serve per il filtro budget.
- `sdgs` (array)
- `status` enum: `draft`, `published`, `archived`
- `created_at`, `updated_at`

**Principio di separazione.** Un `tb_format` NON è un'`experience`. Sono due oggetti diversi con cicli di vita diversi. Se un giorno un format TB diventa erogabile anche in modalità volontariato (improbabile, ma possibile), si crea un'`experience` corrispondente con i propri dati.

### 3.2 `tb_requests` — il caso aperto

Una riga per ogni richiesta di TB che un HR apre. È il "caso" che segue tutto il flusso.

Campi principali:

- `id`, `company_id`, `created_by` (profile_id dell'HR o, se compilato a nome cliente, del super admin)
- `title` — identificativo umano della richiesta (es. "TB primavera 2026 - team Marketing")
- `status` enum: `draft`, `submitted`, `in_matching`, `proposals_sent`, `proposals_reviewed`, `quote_requested`, `quote_in_composition`, `quote_sent`, `quote_accepted`, `quote_rejected`, `signed`, `event_scheduled`, `completed`, `cancelled`
- `activity_type` — stesso enum di `tb_formats.activity_type`, valore scelto dall'HR nel brief
- `participants_min`, `participants_max`
- `preferred_period_from`, `preferred_period_to` — flessibile: l'HR può dire "settembre o ottobre" senza doversi impegnare su una settimana specifica
- `budget_estimate` — cifra indicativa che l'HR dichiara
- `location_city_id` — città preferita
- `extra_services` JSONB — oggetto con chiavi come `{lunch: true, transport: false, location_rental: true, catering_social: true, notes: "..."}`. JSONB per non dover creare colonne per ogni possibile servizio.
- `notes` — note libere dell'HR
- `assigned_admin_id` — super admin assegnato al caso, nullable finché non assegnato
- `created_at`, `updated_at`

Una `tb_request` può chiudersi in vari stati terminali: `completed` (evento avvenuto), `cancelled` (abbandonata), `quote_rejected` (cliente ha rifiutato). Il ciclo di vita è lineare ma con possibili ritorni (es. `quote_rejected` → nuovo ciclo di quotation su proposte diverse).

### 3.3 `tb_proposals` — le schede al cliente

Le "Best Ideas" del whiteboard. Ogni riga è un format proposto al cliente per una specifica richiesta. Una `tb_request` genera 3-5 `tb_proposals`.

Campi principali:

- `id`, `tb_request_id`, `tb_format_id`
- `override_association_id` — nullable, usato quando il `tb_format` ha `association_id` null e il super admin sta scegliendo *in questo caso* quale ETS proporre. Se valorizzato, prevale sul valore del format.
- `priority` — ordine di visualizzazione al cliente (1 è la prima scheda)
- `admin_notes` — note che il super admin vuole comunicare al cliente su questa proposta (es. "Versione custom per 80 pax con parte di briefing finale")
- `client_status` enum: `pending`, `interested`, `needs_clarification`, `declined` — selezione del cliente sulla scheda
- `client_decision_at` — timestamp della scelta cliente
- `association_visibility` enum: `visible`, `hidden` — controllo granulare sulla visibilità del nome ETS in questa proposta specifica. Default `visible`. Il DB è flessibile per test A/B o scelte caso per caso.
- `created_at`, `updated_at`

Per risolvere quale ETS mostrare in UI: `COALESCE(override_association_id, tb_format.association_id)`. Se entrambi sono null, significa che il super admin non ha ancora assegnato un'ETS — condizione di errore, la proposta non dovrebbe essere inviata al cliente finché non c'è un ETS.

### 3.4 `tb_quotes` + `tb_quote_items` — il preventivo

Un preventivo per ogni richiesta in cui il cliente ha selezionato almeno una proposta. **Un solo preventivo attivo alla volta per ciascuna `tb_request`**; in caso di modifiche richieste dal cliente, il precedente va in `superseded` e se ne crea uno nuovo (mantenere storico è utile per audit e analytics).

`tb_quotes` campi principali:

- `id`, `tb_request_id`
- `version` — progressivo (1, 2, 3...) se ci sono state revisioni
- `status` enum: `draft`, `sent`, `viewed`, `accepted`, `rejected`, `modification_requested`, `superseded`
- `sent_at`, `viewed_at`, `decided_at`
- `client_decision_notes` — campo libero se il cliente chiede modifiche
- `total_amount_final` — totale a cliente (ridondante con somma items, ma utile per query veloci)
- `total_amount_ets` — totale quanto incassano le ETS complessivamente (solo visibile super admin)
- `bravo_margin_amount` — differenza (solo visibile super admin)
- `terms_text` — termini contrattuali standard, editabili dal super admin
- `pdf_url` — opzionale, popolato quando si genera il PDF del preventivo
- `created_by`, `created_at`, `updated_at`

`tb_quote_items` campi principali:

- `id`, `tb_quote_id`
- `tb_proposal_id` — nullable, popolato se l'item deriva da una proposta scelta dal cliente; null se è una voce libera (logistica, trasporti, extra)
- `description` — nome della voce
- `association_id` — nullable, popolato se la voce è erogata da un'ETS specifica (le voci libere come "trasporti" non hanno ETS)
- `quantity` — numero di partecipanti, ore, pezzi
- `unit_price_final` — prezzo unitario per il cliente
- `unit_price_ets` — prezzo unitario che l'ETS incassa (solo super admin)
- `total_final` — `quantity * unit_price_final`
- `total_ets` — `quantity * unit_price_ets`, solo super admin
- `notes` — note libere per voce
- `display_order` — ordinamento nell'UI del preventivo

**Principio.** Il preventivo è composto da items. Ogni item ha un prezzo finale (ciò che vede il cliente) e, opzionalmente, un prezzo ETS (ciò che sa solo Bravo!). La differenza è il margine. Questo modello permette margini diversi per voce, e permette voci senza margine (voci "pass-through" o servizi direttamente Bravo!).

### 3.5 `tb_contracts` — la firma

Una riga per ogni preventivo che diventa contratto firmato.

Campi principali:

- `id`, `tb_quote_id` (FK, uno-a-uno con preventivo accettato)
- `signed_at`
- `signature_method` enum: `manual_external` (V1: firmato su PDF fuori app, super admin conferma), `click_in_app` (V2: clic con log o Docusign)
- `signer_profile_id` — chi ha firmato
- `signer_ip` — opzionale, per `click_in_app`
- `signer_user_agent` — opzionale, per `click_in_app`
- `contract_pdf_url` — URL del PDF firmato (se esiste)
- `terms_version_signed` — snapshot dei termini al momento della firma (i termini possono cambiare nel tempo, serve sapere cosa è stato effettivamente firmato)
- `created_at`

In V1 si usa `manual_external`. `click_in_app` rimane per V2.

### 3.6 `tb_matching_decisions` — il log per la futura AI

Ogni scelta di matching viene loggata. Questa tabella è **il dataset di training futuro**.

Campi principali:

- `id`, `tb_request_id`, `tb_format_id`
- `decision` enum: `shown_in_filter` (il format è emerso dal filtro SQL per questa richiesta), `selected_as_proposal` (il super admin l'ha scelto come proposta), `discarded` (filtrato ma scartato dal super admin), `client_interested`, `client_declined`, `client_needs_clarification`
- `decided_by` — super admin per le decisioni 2 e 3, HR per le 4-6
- `decision_reason` — campo libero o tag: "prezzo_troppo_alto", "città_diversa_poco_attraente", "già_fatto_con_questa_azienda", "attività_non_adatta_al_team", "preferenza_cliente_altro_format"
- `context` JSONB — snapshot dei parametri della request al momento della decisione, per poter riprodurre lo scenario
- `created_at`

Una `tb_request` genera molte righe qui: per ogni format che emerge dal filtro, una riga `shown_in_filter`; per ognuno che viene scelto, una riga `selected_as_proposal`; per ogni scelta del cliente, una riga `client_interested`/`client_declined`/eccetera.

**Questa tabella non serve in V1 per far funzionare il flusso** — il flusso funziona anche senza. Ma è il prezzo del biglietto per il futuro: senza log oggi, nessuna AI domani.

---

## 4. Gli stati e il flusso

Il flusso ha otto fasi, in sequenza lineare con possibili ritorni.

### Fase 1 — Brief (HR → `tb_request` in stato `submitted`)

L'HR apre la pagina "Richiedi un Team Building" nell'app. Compila un form guidato: tipo di attività, range partecipanti, periodo preferito, budget, location, servizi extra (pranzo, trasporti, location…), note libere. Salva. Il form genera una riga in `tb_requests` con `status = submitted`.

Il super admin riceve notifica (email + badge in app). La `tb_request` è in coda di lavorazione.

### Fase 2 — Matching (Super Admin → proposte create)

Il super admin apre la richiesta nel pannello "Richieste TB". Vede i parametri del brief. L'app mostra automaticamente il catalogo `tb_formats` filtrato sui parametri: stesso `activity_type`, città compatibile, budget range compatibile, partecipanti range compatibile. Ogni format visto in questo filtro genera una riga `tb_matching_decisions` con `decision = shown_in_filter`.

Il super admin sceglie 3-5 format. Per ciascuno, se il format ha `association_id` null, sceglie **quale ETS** assegnare tra quelle in `tb_format_associations` (o inserisce un'ETS custom). Ogni scelta genera un `tb_proposal` e una riga `tb_matching_decisions` con `decision = selected_as_proposal`. Può aggiungere note per il cliente su ciascuna proposta.

Clicca "Invia al cliente". La `tb_request` passa a `proposals_sent`. Viene triggerata l'email all'HR.

### Fase 3 — Proposte al cliente (HR → `tb_proposal.client_status` aggiornati)

L'HR riceve notifica (email + in-app). Apre la pagina "Le mie proposte TB" per la richiesta in questione. Vede 3-5 schede "Best Ideas": titolo, foto, descrizione sintetica, programma della giornata, città, note di Bravo!. **Non vede ancora il prezzo** — il prezzo si costruisce solo dopo aver contattato l'ETS. **Non vede ancora l'ETS** - l'ETS verrà mostrato nella Fase 6.

Per ogni scheda, HR marca: `interested` / `needs_clarification` / `declined`. Può aggiungere note.

Quando HR chiude la fase (pulsante "Conferma scelte"), la `tb_request` passa a `proposals_reviewed`. Super admin riceve notifica.

### Fase 4 — Quotazione ETS (Super Admin → email o pannello ETS)

Super admin apre la richiesta. Vede quali proposte sono in `interested` o `needs_clarification`. Per ciascuna:

**V1.** Clicca "Richiedi quotazione all'ETS" → viene triggerata l'email strutturata all'ETS (`send-tb-quote-request`). L'email contiene: dettagli richiesta (data, pax, servizi extra), descrizione del format, richiesta di prezzo e disponibilità conferma. L'ETS risponde via mail a team@bravoapp.it. Super admin, quando riceve la risposta, inserisce manualmente il prezzo ETS in app (nella composizione del preventivo, vedi Fase 5).

**V2.** L'ETS riceve notifica in-app, apre il proprio pannello "Richieste di quotazione", risponde con prezzo e disponibilità. Super admin riceve notifica automatica. Il prezzo ETS è già in sistema.

La `tb_request` passa a `quote_requested`.

### Fase 5 — Composizione preventivo (Super Admin → `tb_quote` in `draft`)

Super admin apre l'editor preventivo per la richiesta. Il sistema precompila un `tb_quote` in `draft` con un item per ogni proposta `interested` per cui c'è un prezzo ETS. Per ogni item, super admin inserisce/modifica: `unit_price_ets` (quanto incassa l'ETS), `unit_price_final` (quanto paga il cliente), margine calcolato automaticamente. Aggiunge eventuali voci libere (logistica, trasporti, "varie ed eventuali").

Il preventivo mostra in tempo reale: totale cliente, totale ETS, margine Bravo!, margine percentuale. Super admin può editare termini contrattuali se diversi dal default.

Clicca "Invia al cliente". `tb_quote.status` passa a `sent`. `tb_request` passa a `quote_sent`. HR riceve notifica.

### Fase 6 — Decisione cliente (HR → `tb_quote.status` aggiornato)

HR riceve email e notifica. Apre la pagina preventivo in app: pagina brandizzata, pulita, con header (da Bravo! a [azienda]), lista voci con prezzo finale per voce (mai `unit_price_ets`, mai `bravo_margin`), totale, data definitiva, termini contrattuali, pulsanti "Accetta" / "Richiedi modifica" / "Rifiuta".

All'apertura della pagina si triggera update: `viewed_at`, `status = viewed`. Un evento `tb_quote_viewed` finisce in `user_events`.

Se HR accetta: `status = accepted`, `tb_request = quote_accepted`. Super admin riceve notifica. Si passa a Fase 7.

Se HR chiede modifiche: `status = modification_requested`, l'HR inserisce note nel campo `client_decision_notes`. Super admin modifica il preventivo: in realtà crea una versione 2 del preventivo (version=2), mette la v1 in `superseded`, invia la v2. Torna a Fase 6 sul nuovo preventivo.

Se HR rifiuta: `status = rejected`, `tb_request = quote_rejected`. Super admin può riaprire tornando a Fase 2 con nuove proposte, oppure chiudere la richiesta in `cancelled`.

### Fase 7 — Firma e contratto

**V1.** Super admin genera (o compone a mano) un PDF del preventivo accettato, lo manda al cliente per firma via mail o altro canale, riceve il PDF firmato, lo carica in `tb_contracts.contract_pdf_url` con `signature_method = manual_external`. `tb_request` passa a `signed`.

**V2.** Al momento dell'accettazione (Fase 6), HR clicca "Accetta e firma" → popup con termini finali, checkbox "Dichiaro di accettare", pulsante "Firma". Viene creato `tb_contracts` con `signature_method = click_in_app`, IP e user agent loggati. `tb_request` passa direttamente a `signed`. Nessun PDF da gestire a mano.

Fattura: come oggi, gestita fuori app dalla contabilità Bravo! a valle dell'accettazione. In V3 si può integrare un sistema di fatturazione elettronica.

### Fase 8 — Esecuzione evento

Al `signed`, si crea automaticamente una riga `tb_events`:

- `id`, `tb_request_id`
- `scheduled_datetime` — popolato quando si conferma la data finale
- `location_name`, `location_address`
- `max_participants` — dal preventivo
- `participant_form_url` — slug univoco per il link pubblico di iscrizione
- `status` enum: `pending_date`, `date_confirmed`, `in_progress`, `completed`

Dashboard evento HR: data/ora dell'evento (o "in attesa di conferma" se pending), countdown, lista iscritti in tempo reale, link pubblico copy-paste da condividere ai colleghi, template comunicazioni pronti (annuncio, reminder, post-evento).

I dipendenti si iscrivono tramite il link pubblico. La pagina pubblica mostra dettagli evento (minimi: titolo, data, luogo) e un form: nome, email aziendale, privacy (sempre obbligatoria), intolleranze (condizionale se `extra_services.lunch = true`). Risposta salvata in `tb_event_participants`. Da studiare se e come mostrare evento nella sezione dedicata agli employees.

Dopo l'evento, super admin (o in V2, l'ETS) conferma "evento concluso". `tb_request` e `tb_events` passano a `completed`. Opzionale: sondaggio post-evento ai partecipanti.

### Quadro riassuntivo fasi → attori

| Fase | HR | Super Admin | ETS |
|---|---|---|---|
| 1. Brief | Compila form | Riceve notifica | — |
| 2. Matching | — | Filtra catalogo, crea proposte | — |
| 3. Proposte al cliente | Marca interesse per scheda | Riceve notifica | — |
| 4. Quotazione ETS | — | Invia email a ETS (V1) / notifica ETS (V2) | Riceve, risponde con prezzo |
| 5. Composizione preventivo | — | Compone items, margini | — |
| 6. Decisione cliente | Accetta / modifica / rifiuta | — | — |
| 7. Firma | (V2: firma in-app) | Gestisce PDF (V1) | — |
| 8. Esecuzione | Dashboard evento, condivide link iscrizione | Conferma data, supporta | (V2: vede iscritti) |

---

## 5. Chi vede cosa

Le policy RLS implementano le quattro regole del capitolo 5 di `sistema-operativo.md`. Qui le specializzazioni per il TB.

**HR vede solo le `tb_requests` della propria `company_id`**, e a cascata le `tb_proposals`, `tb_quotes`, `tb_contracts`, `tb_events` collegate. Su `tb_quote_items` l'HR vede `unit_price_final` e `total_final`, **non** `unit_price_ets` e `total_ets`. Questo si implementa con una view dedicata `tb_quote_items_client_view` che espone solo le colonne finali, e l'RLS che lega la view all'HR.

**Super Admin vede tutto.** Tutte le tabelle, tutte le colonne, in qualsiasi stato. Può editare qualsiasi cosa.

**ETS Admin vede** (V2) le `tb_quote_items` dove `association_id` è la propria, ma solo `unit_price_ets` e `total_ets` (no `unit_price_final`, no `bravo_margin`). Vede le `tb_events` dove partecipa come erogatore, con lista iscritti (per preparare logistica). Non vede le `tb_requests` o le altre proposte concorrenti.

**Dipendente non vede nulla del TB**. Il suo unico punto di contatto è la pagina pubblica di iscrizione all'evento, che non richiede login né appartenenza a una company specifica (quindi niente RLS standard, solo controlli applicativi sul form).

**Catalogo `tb_formats`** in stato `published` è visibile al super admin e agli ETS che vi figurano come erogatori. Gli HR **non vedono il catalogo direttamente**: il loro unico contatto con il catalogo è attraverso le `tb_proposals` che Bravo! costruisce per loro. Questo è un punto che merita attenzione strategica: per il volontariato il catalogo è pubblico dentro la piattaforma, per il TB no. La ragione è che il TB richiede mediazione (prezzo, ETS, logistica) e un catalogo aperto darebbe aspettative sbagliate al cliente.

---

## 6. UI dedicata

### 6.1 Lato HR

Ancora in fase di lavorazione e da affinare. Sono sicuramente necessarie 3 pagine principali.

**`/hr/team-building`** — indice delle richieste TB dell'azienda, con stato di ciascuna, ultimo aggiornamento, call-to-action contestuale ("Rispondi alle proposte", "Apri preventivo", "Vedi evento"). In alto, grande pulsante "Nuova richiesta di team building".

**`/hr/team-building/nuova`** — form brief guidato. UX a step o a pagina singola scorrevole: tipo attività (scelta da enum con icone), partecipanti (range con slider), periodo, budget, città, servizi extra (checkbox), note. Salva e invia.

**`/hr/team-building/{id}`** — pagina della singola richiesta, con sezioni dinamiche in base allo stato:
- Se `proposals_sent`: vista delle 3-5 schede "Best Ideas" con selezione client_status
- Se `quote_sent`: vista del preventivo (con pulsante "Accetta" e alternative)
- Se `signed`: dashboard evento (countdown, iscritti, link condivisibile, template comunicazione)

### 6.2 Lato Super Admin

**`/admin/team-building/richieste`** — tabella di tutte le `tb_requests` con filtri per stato, azienda, assigned_admin. Colonne: azienda, titolo, stato, giorni fermi in stato corrente, alert se oltre soglia. Click → dettaglio richiesta.

**`/admin/team-building/richieste/{id}`** — workspace del caso. A sinistra pannello informativo (brief, storia, eventi). Al centro, sezione operativa dinamica in base a stato:
- Stato `submitted` o `in_matching`: filtro catalogo + selezione proposte
- Stato `proposals_reviewed`: lista proposte con pulsante "Richiedi quotazione ETS" per ciascuna interessata
- Stato `quote_in_composition`: editor preventivo
- Stato `signed`: pannello esecuzione evento

**`/admin/team-building/formats`** — gestione catalogo TB (CRUD dei `tb_formats`). Qui il super admin crea, modifica, archivia i format, gestisce le ETS associate, le città, i range.

**`/admin/team-building/matching-lab`** — (opzionale, V1.5) pannello analytics del matching: quante decisioni scartano quali format, quali format emergono ma non vengono mai scelti dal cliente. Utile per capire il catalogo.

### 6.3 Lato ETS (V2)

**`/association/team-building/richieste`** — lista richieste di quotazione ricevute. Per ciascuna: data dell'evento, pax, format richiesto, servizi extra, deadline risposta. Pulsante "Rispondi con preventivo".

**`/association/team-building/eventi`** — lista eventi confermati in cui l'ETS è erogatore. Per ciascuno: data, luogo, pax iscritti finora, dettagli logistici. L'ETS usa questa pagina per prepararsi all'evento.

### 6.4 Pagine pubbliche (nessun login)

**`/iscrizione-evento/{slug}`** — pagina pubblica di iscrizione per i dipendenti. Mostra dettagli minimi dell'evento e form con i campi previsti (privacy, eventuali intolleranze). Slug univoco protegge da scraping massivo; nessun dato sensibile esposto.

---

## 7. Email e notifiche

Tutte le email TB seguono il pattern di `send-transactional-email`. Template in `supabase/functions/_shared/transactional-email-templates/`.

**Email essenziali V1:**

1. `tb-request-submitted` → a super admin, quando HR invia brief
2. `tb-proposals-ready` → ad HR, quando super admin invia le schede
3. `tb-quote-request-ets` → ad ETS, richiesta di prezzo (con tutti i dettagli della richiesta)
4. `tb-quote-sent` → ad HR, quando il preventivo è pronto
5. `tb-quote-accepted` → a super admin, quando HR accetta
6. `tb-quote-modification-requested` → a super admin, quando HR chiede modifiche
7. `tb-quote-rejected` → a super admin, quando HR rifiuta
8. `tb-event-confirmed` → ad HR, quando data evento è confermata
9. `tb-event-reminder-participant` → ai partecipanti, giorno prima dell'evento

**Notifiche in-app** (V1 o V1.5): gli stessi eventi generano notifiche in una tabella `notifications` già presente o da creare, consultabili dal badge in header. Le notifiche sono idempotenti e non duplicano le email. Da capire se e come gestire notifiche tramite web app.

---

## 8. Eventi analytics

Ogni momento chiave del flusso genera un evento in `user_events`. Elenco base per V1:

- `tb_request_started` — HR apre il form (anche se non lo completa)
- `tb_request_submitted` — HR completa e invia il brief
- `tb_proposals_viewed` — HR apre la pagina delle proposte
- `tb_proposal_interest_expressed` — HR marca `interested` su una proposta
- `tb_quote_viewed` — HR apre la pagina preventivo
- `tb_quote_accepted`, `tb_quote_rejected`, `tb_quote_modification_requested`
- `tb_contract_signed`
- `tb_event_participant_registered`
- `tb_event_completed`

**Cruscotto super admin.** Una pagina `/admin/analytics/aziende-tb` che legge `user_events` e restituisce, per ogni azienda con almeno una `tb_request`:

- stato corrente della richiesta più recente
- giorni da ultimo evento significativo
- alert rossi/gialli in base a soglie ("preventivo non aperto da 3 giorni", "schede proposte non viste da 7 giorni", "non si è mai loggato dopo creazione account")

Questo è il pannello che risolve il caso d'uso "Mario si è fermato qui, aspetta che lo chiamo".

---

## 9. Cosa entra in V1 e cosa no

**V1 (da costruire adesso):**

- `tb_formats` con CRUD super admin e import da CSV storici
- `tb_requests` con form HR e pannello super admin
- `tb_proposals` con vista schede HR e selezione
- Email di Fase 2, 3, 4 (richiesta quotazione ETS via mail template)
- `tb_quotes` + `tb_quote_items` con editor super admin e vista HR
- `tb_contracts` con firma manuale esterna (`manual_external`)
- `tb_events` con dashboard evento HR + pagina pubblica iscrizione
- `tb_matching_decisions` — log base (shown_in_filter, selected_as_proposal, client choices). Dashboard analytics sopra può aspettare V1.5.
- `user_events` — con gli eventi essenziali sopra
- Cruscotto super admin "aziende TB" — versione base, aggregata su `user_events` e `tb_requests.status`

**V2 (dopo validazione V1):**

- Pannello ETS per ricevere richieste di quotazione e rispondere in app
- Firma `click_in_app` con logging legale
- Generazione PDF preventivo da dati strutturati
- Analytics matching_lab per super admin
- Notifiche push mobile per dipendenti

**V3:**

- DocuSign/firma qualificata
- AI/scoring per matching automatico
- Fatturazione elettronica integrata

---

## 10. Migrazione dati dalla vecchia piattaforma

I CSV storici con i format TB esistenti (Cartapesta, Cooking class, Dragon Boat, ecc.) vanno importati in `tb_formats` come catalogo iniziale.

**Preparazione dati prima dell'import:**

1. Identificare per ogni riga se ha ETS associata (risposta: mix). Se sì, matchare il nome con `associations.name` del DB attuale. Se non c'è match, decidere: (a) creare la riga in `associations`, (b) importare il format come `association_id = null` e popolare `tb_format_associations` con ETS candidate.
2. Matchare le città con `cities.id`. Se città assente, crearla.
3. Matchare categoria con `categories.id`. Se manca una categoria TB-specifica, aggiungerla.
4. Pulire/normalizzare range partecipanti e range prezzo.
5. Assegnare `activity_type` a ogni format (lavoro manuale di super admin, ~100-200 format in totale?).

**Modalità import.** Script SQL o edge function dedicata che legge CSV e insert-a. Da eseguire manualmente dal super admin, con preview dei risultati prima del commit. Non automatizzare questo step: la qualità del catalogo iniziale è decisiva per il matching, val la pena controllare riga per riga.

**Prima di fare l'import**, Filippo mi condivide il CSV in un messaggio dedicato. Guardo struttura e qualità dati, poi costruiamo insieme lo script di import come prompt Lovable separato.

---

## Come si usa questo documento

Per ogni prompt (creazione tabelle, pagina HR, editor preventivo, ecc.), il doc fornisce il contesto di cosa si sta costruendo e perché. Il prompt sarà un'istanza concreta di una sezione di questo doc.

Se durante la costruzione emerge una scelta di design che si discosta dal doc, **si aggiorna il doc prima di procedere**. Il doc resta allineato al codice; se il doc è obsoleto, non è più bussola ed è solo rumore.

Responsabile del documento: Filippo (product owner).

---

*Versione 1.0 — Aprile 2026*
