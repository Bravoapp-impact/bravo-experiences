# Volontariato Aziendale

Il flusso del verticale volontariato di Bravo!. Modello di riferimento per implementazione, manutenzione e prompt Lovable.

---

## 1. Cos'è il volontariato in Bravo!

Il volontariato aziendale è il primo dei verticali di Bravo!. È il punto in cui i dipendenti di un'azienda incontrano gli ETS della rete attraverso esperienze concrete sul territorio.

A differenza del team building (`tb-flow.md`), che richiede un brief HR, una negoziazione di proposte e un preventivo per singolo evento, il volontariato è un **catalogo continuo**: l'azienda ha un programma annuale, l'ETS pubblica esperienze, il dipendente sfoglia e prenota in autonomia. Il movimento del valore è in pull, non in push.

Il volontariato è anche il verticale economicamente più ricorrente del modello: l'azienda compra un pacchetto di ore di volontariato che resta attivo per dodici mesi, all'interno del quale i dipendenti prenotano slot specifici delle esperienze attivate per loro. La rappresentazione di questo pacchetto commerciale non è oggi in piattaforma — vedi §4 (`hour_budgets`).

Questo documento descrive il flusso operativo del volontariato dal punto di vista dei quattro attori, lo schema dati che lo regge, le transizioni di stato delle entità principali, le RPC critiche, e il ciclo di email transazionali.

Non copre: calendario aggregato HR, galleria multimediale, report d'impatto, comunicazioni broadcast, suggerimenti ETS trasversali, console super-admin. Sono trattati separatamente quando ognuno avrà la sua priorità.

---

## 2. I quattro attori nel volontariato

### HR

Il referente HR vede una **vista unica** del proprio programma di volontariato, sotto la voce "Volontariato aziendale" della sidebar. La vista mostra le esperienze attivate per l'azienda — non un catalogo generale, ma la selezione concordata.

Cliccando su un'esperienza, si apre il dettaglio (`/hr/experiences/:id`) con le informazioni del format e la lista delle prossime date pianificate. Per ogni data, l'HR vede il numero di iscritti.

Cosa HR fa direttamente nel volontariato:

- Vede le esperienze attive nel proprio programma
- Vede il dettaglio di ogni esperienza
- Vede le prossime date di ogni esperienza, con il numero di iscritti per ciascuna

Cosa HR **non** fa nel volontariato:

- Non cura un catalogo di esperienze candidate (a livello DB, le RLS impediscono qualsiasi `INSERT`/`DELETE` su `experience_companies` da parte di HR)
- Non gestisce date o capienze
- Non modifica le esperienze attive
- Non configura il budget ore individuale (lo richiede al referente Bravo!, che lo setta su `hour_budgets`)

Se HR vuole cambiare il programma (nuova esperienza, periodo specifico, ulteriore città, modifica budget), contatta oggi il referente Bravo! — telefono, email, WhatsApp. La formalizzazione di queste richieste in piattaforma è in stand-by e verrà valutata separatamente.

### Dipendente

Il dipendente è il fruitore primario del catalogo. Apre `/app/experiences`, naviga le esperienze pubblicate per la propria company, sceglie una data di un'esperienza, prenota. Riceve un'email di conferma. Si presenta all'evento. Dopo l'evento può lasciare una recensione.

Il dipendente vede solo le esperienze attivate per la propria company tramite il bridge `experience_companies`. Non vede esperienze di altre aziende, non vede il catalogo generale della rete.

### ETS

L'ETS (Ente del Terzo Settore) pubblica le proprie esperienze nel catalogo della rete Bravo!. Per ogni esperienza pubblicata e validata dal super-admin, l'ETS aggiunge date specifiche (`experience_dates`) con capienza e ore di volontariato.

Le date possono essere:

- **generaliste**: visibili a tutte le aziende che hanno l'esperienza attiva (`experience_dates.company_id = NULL`)
- **company-specific**: riservate a una sola azienda (`experience_dates.company_id` valorizzato), ad esempio per un evento dedicato concordato con HR

L'ETS vede le prenotazioni delle proprie esperienze e i profili dei partecipanti via RLS dedicato. Vede solo i propri dati: non vede prenotazioni di altre ETS, non vede margini Bravo!, non vede cosa paga l'azienda. Visibilità mediata secondo `principi.md` §4.2.

### Super-admin (Bravo!)

Il super-admin è l'orchestratore del verticale. Responsabilità operative:

- Accreditare ETS e validare le loro esperienze (transizione `draft` → `published`)
- Attivare le esperienze per ogni azienda cliente (bridge `experience_companies`)
- Configurare `hour_budgets` quando viene firmato un contratto
- Coordinare con le ETS le date company-specific richieste dall'azienda
- Riservare date a singole aziende valorizzando `experience_dates.company_id` (azione esclusiva super-admin — l'ETS crea sempre date aperte)
- Decidere se un'esperienza è condivisa (`visibility = 'public'`, attivabile per più aziende) o esclusiva (`visibility = 'private'`, vincolata a una sola azienda dal trigger DB)
- Smistare modifiche al programma quando HR le richiede
- Gestire i suggerimenti ETS in arrivo (flusso trasversale, fuori da questo documento)
- Gestire casi limite (cancellazioni, sovrapposizioni, ETS in difficoltà)

La console super-admin esiste oggi ma è frammentata su più pagine. Il suo consolidamento è la priorità subito successiva a questo documento (trattata in documento separato).

---

## 3. Il flusso end-to-end

Tre sotto-flussi distinti, in sequenza temporale.

### 3.1 Attivazione del programma volontariato

L'azienda firma un contratto con Bravo!. Il super-admin riceve la conferma e:

1. Crea il record `companies` se non esiste, con i dati di contratto
2. Crea il record `hour_budgets` con `hours_per_employee_year` (può essere `NULL` se nessun tetto individuale è richiesto dall'HR)
3. Attiva nel bridge `experience_companies` le esperienze concordate per quella company
4. Coordina con le ETS le eventuali date company-specific (`experience_dates.company_id`)
5. Invia all'HR le credenziali e i codici di registrazione per i dipendenti

Da questo momento HR può accedere alla vista del proprio programma e i dipendenti registrati possono prenotare.

### 3.2 Ciclo di prenotazione del dipendente

Per ogni prenotazione, il dipendente:

1. Apre `/app/experiences` e vede il catalogo della propria company
2. Apre il dettaglio di un'esperienza (`/app/experiences/:id`)
3. Sceglie una `experience_date` specifica
4. Conferma la prenotazione

Al momento dell'`INSERT` su `bookings` la RLS verifica:

- Il dipendente sta prenotando per sé (`user_id = auth.uid()`)
- La data esiste, è futura, ha posti residui (`is_experience_date_available`)
- L'azienda ha l'esperienza attivata (join su `experience_companies`)
- Il budget ore annuo individuale non viene superato (`check_hour_budget`)

Se tutto passa, la prenotazione entra in stato `confirmed`. Parte la mail di conferma al dipendente (`send-booking-confirmation`).

**Manca oggi** (§7): notifica all'ETS della nuova prenotazione.

Il dipendente può cancellare la propria prenotazione finché `is_booking_cancellable` lo permette (la regola di cutoff temporale è codificata nella RPC). Alla cancellazione la riga passa a `status = cancelled`.

**Manca oggi** (§7): notifica all'ETS della cancellazione.

### 3.3 Esecuzione, conclusione e feedback

L'evento si svolge. Dopo la data:

1. `process_completed_events` (schedulata via `pg_cron`) processa le date passate e marca i `bookings` come `completed`. Il trattamento dei `no_show` va verificato nel codice — vedi §6.
2. Il dipendente può lasciare una `experience_review` collegata al proprio `booking`
3. HR vede aggiornarsi i propri dati di partecipazione (vista, non console)

**Manca oggi** (§7): email post-evento al dipendente che lo invita a lasciare la recensione. Senza, le recensioni dipendono dalla buona volontà e il dato di soddisfazione resta povero.

---

## 4. Schema dati

Le tabelle del volontariato.

### `experiences`

L'unità di catalogo. Una riga per ogni esperienza di volontariato pubblicata da un'ETS.

Campi chiave:

- `id` (uuid)
- `title`, `description`, `short_description`, `image_url`
- `association_id` (FK a `associations`) — ETS che eroga
- `category_id` (FK a `categories`)
- `city_id` (FK a `cities`)
- `address`
- `volunteer_hours` — ore-volontario per partecipazione tipo (default, può essere sovrascritto sulla singola `experience_date`)
- `sdgs` (array)
- `status` enum: `draft` / `published` / `archived`
- `visibility` enum: `public` (condivisa, attivabile per più aziende via `experience_companies`) / `private` (esclusiva di una sola azienda, vincolata da trigger DB — vedi sotto)

L'ETS crea l'esperienza in `draft`. Il super-admin rivede e passa a `published`. Una volta `published`, l'esperienza è candidata ad essere attivata per le aziende via `experience_companies`. La scelta `public`/`private` è del super-admin e si imposta dal `VisibilityDialog` (toggle "Condivisa"/"Esclusiva").

**RLS attuale per HR**: vede solo le `experiences` con `status = 'published'` che hanno una riga corrispondente in `experience_companies` per la propria company. Policy `HR can view own program experiences v4` (maggio 2026).

### `experience_companies`

Bridge N:N. Decide quali aziende vedono quali esperienze.

Campi: `experience_id`, `company_id`, eventuali timestamp di attivazione.

Una riga in questa tabella è ciò che HR vede come "esperienza nel mio programma". L'attivazione la fa il super-admin.

**RLS attuale**: HR può leggere (`SELECT`) le righe della propria company. Non può scrivere: solo il super-admin esegue `INSERT`/`UPDATE`/`DELETE`. A maggio 2026 sono state rimosse le policy legacy `HR admin can activate experiences for own company` (INSERT) e `HR admin can deactivate experiences for own company` (DELETE), residui del modello in cui HR curava il catalogo — chiusura di una falla di privilege escalation.

**Trigger di consistenza esclusività.** Due trigger DB garantiscono l'invariante `visibility = 'private'` ⇔ al più 1 riga nel bridge per quell'esperienza:

- `enforce_private_single_company_on_bridge` (BEFORE INSERT su `experience_companies`): blocca l'aggiunta di una seconda riga se l'esperienza è `private`
- `enforce_private_single_company_on_experiences` (BEFORE UPDATE OF visibility su `experiences`): blocca il passaggio a `private` se nel bridge ci sono già >1 aziende

Entrambi richiamano la funzione `public.enforce_private_experience_single_company()`. Messaggi di errore in italiano. La sequenza di salvataggio nel `VisibilityDialog` rispetta il trigger: DELETE bridge → UPDATE visibility → INSERT bridge.

### `experience_dates`

Una riga per ogni slot prenotabile di un'esperienza.

Campi chiave:

- `id` (uuid)
- `experience_id` (FK)
- `start_datetime`, `end_datetime`
- `max_participants`
- `volunteer_hours` — può sovrascrivere il default dell'esperienza
- `company_id` (FK, nullable) — se valorizzato, la data è riservata a quella sola company; se `NULL`, è aperta a tutte le aziende che hanno l'esperienza attiva

**Modello a 2 assi indipendenti.** L'esclusività vive su due assi distinti:

- Asse esperienza: `experiences.visibility` (`public` / `private`)
- Asse data: `experience_dates.company_id` (`NULL` / valorizzato)

I due assi non sono accoppiati. Una stessa esperienza condivisa (`public`) può avere alcune date aperte (`company_id IS NULL`) e altre riservate ad aziende diverse. Caso d'uso target ("canile alternato"): l'ETS organizza un turno bisettimanale al canile, l'azienda A prenota il 1° e 3° mercoledì del mese (date con `company_id = A`), l'azienda B prenota il 2° e 4° (date con `company_id = B`), senza che A veda le date di B e viceversa. L'esperienza in sé è `public` e attivata per entrambe.

**Chi imposta `company_id` sulle date.** Solo il super-admin. L'ETS crea sempre date aperte: la RLS `association_manage_own_experience_dates_v2` ha un `WITH CHECK` che impedisce all'ETS di valorizzare `company_id`. La riservazione di una data a una specifica azienda è un'azione di mediazione e resta in mano a Bravo!.

### `bookings`

Una riga per ogni prenotazione di un dipendente su una data.

Campi:

- `id` (uuid)
- `user_id` (FK a `profiles`)
- `experience_date_id` (FK)
- `status` enum: `confirmed` / `cancelled` / `completed` / `no_show`
- `created_at`, `updated_at`

Vincoli RLS in `INSERT`: vedi §3.2.

### `hour_budgets`

Tetto annuo individuale di ore di volontariato per dipendente, per company.

Campi:

- `company_id` (FK)
- `hours_per_employee_year` — può essere `NULL` (nessun limite)
- `fiscal_year_start` o equivalente per definire la finestra annuale

**Importante**: questa tabella **non** rappresenta il pacchetto ore commerciale acquistato dall'azienda. È un tetto individuale che alcune HR vogliono impostare per evitare che un singolo dipendente prenoti decine di ore.

Il pacchetto commerciale (200h / 400h / 600h secondo dimensione, vedi Business Plan) è oggi gestito interamente fuori piattaforma — venduto in offline, tracciato in CRM/Excel. È una convenzione consapevole, da formalizzare quando si vorrà introdurre nel sistema la rappresentazione economica del programma. Confondere i due concetti (tetto individuale vs. pool aziendale acquistato) creerebbe debito che è meglio non accumulare.

### `experience_reviews`

Recensioni lasciate dai dipendenti dopo l'evento.

Campi: `booking_id` (FK), `rating`, `feedback_positive`, `feedback_improvement`, `would_recommend`, `created_at`.

Una recensione per booking. Visibili sul profilo pubblico dell'ETS e dal super-admin in console.

### `association_suggestions` (riferimento)

Esiste come tabella nel sistema. Il suo flusso operativo (raccolta da HR e dipendenti tramite tab trasversale, gestione super-admin) è cross-verticale e non specifico del volontariato. Citato qui solo per non lasciare dubbi sull'esistenza dell'entità.

---

## 5. Stati e transizioni

### `experiences.status`

| Stato | Significato | Chi transiziona |
| --- | --- | --- |
| `draft` | L'ETS sta lavorando alla scheda | ETS |
| `published` | Validata dal super-admin, candidata all'attivazione | Super-admin |
| `archived` | Non più disponibile, conservata per storico | Super-admin |

Una richiesta di modifica da parte di HR non genera oggi un nuovo stato sull'esperienza. È una conversazione con il referente. Se la richiesta porta a una modifica reale, è il super-admin a editarla direttamente (o a chiedere all'ETS di farlo, riportandola temporaneamente in `draft` se serve).

### `bookings.status`

| Stato | Significato | Chi transiziona |
| --- | --- | --- |
| `confirmed` | Prenotazione attiva | Dipendente all'`INSERT` |
| `cancelled` | Annullata prima dell'evento | Dipendente (entro cutoff) o super-admin |
| `completed` | Partecipato all'evento | `process_completed_events` (cron) |
| `no_show` | Non si è presentato | Da verificare nel codice se cron o ETS manualmente |

### `experience_dates`

Le date non hanno uno stato esplicito. La loro "vita" si deduce da:

- `start_datetime` futura o passata
- Posti residui (`max_participants` meno bookings `confirmed`)
- Eventuale `company_id` per scoping aziendale

---

## 6. RPC critiche

Tutte le RPC seguono il pattern `SECURITY DEFINER`, `SET search_path = public, pg_temp`, autorizzazione esplicita in cima, `REVOKE EXECUTE FROM PUBLIC` + `GRANT EXECUTE TO authenticated`. Le scritture sensibili passano da RPC, non da `INSERT`/`UPDATE` diretti.

| RPC | Cosa fa | Quando viene chiamata |
| --- | --- | --- |
| `is_booking_cancellable(booking_uuid)` | Verifica se una prenotazione è ancora cancellabile rispetto al cutoff temporale | Client prima di mostrare "Annulla" |
| `is_experience_date_available(exp_date_id)` | Verifica posti residui e data non passata | RLS `INSERT` su `bookings` |
| `check_hour_budget(user_id, exp_date_id)` | Verifica che il budget annuo individuale non sia superato | RLS `INSERT` su `bookings` |
| `hr_has_historical_booking_for_date(date_id, user_id)` | Lookup per viste HR (statistiche storiche utente) | Vista HR utenti |
| `process_completed_events()` | Processa date passate, marca `bookings` come `completed` | Cron via `pg_cron` |
| `get_user_company_id(user_uuid)` | Lookup company dal profilo | Trasversale, RLS |
| `get_user_association_id(user_uuid)` | Lookup association dal profilo | Trasversale, RLS |
| `is_admin`, `is_super_admin`, `is_association_admin` | Wrapper booleani per ruolo | Trasversali, RLS |

**Punto aperto**: il comportamento di `process_completed_events` rispetto a `no_show`. Se il cron marca solo `completed` e il `no_show` è manuale, serve un'UI nel pannello ETS per segnare le assenze a fine evento. Se invece il cron li gestisce entrambi sulla base di un flag presenza, l'UI di "segna presenze" va comunque costruita perché qualcuno deve popolare quel flag. Impatta l'esperienza dell'ETS e il dato di partecipazione che alimenta i report.

---

## 7. Lifecycle email

Pipeline email: Lovable nativa, sul dominio verificato `updates.bravoapp.it`. Code via `pgmq`, scheduling via `pg_cron`. Pattern wrapper su `send-transactional-email` (vedi esempi consolidati in `tb-flow.md`, ad esempio `tb-quote-sent`).

### Esistenti oggi

| Email | Destinatario | Trigger | Edge function |
| --- | --- | --- | --- |
| Conferma prenotazione | Dipendente | `INSERT` su `bookings` con `status = confirmed` | `send-booking-confirmation` |

### Da implementare prima del lancio HAVAS (giugno 2026)

Tre email che chiudono i buchi operativi più gravi del verticale. Senza queste, il lancio operativo con un cliente vero è esposto a rischio reputazionale concreto.

| Email | Destinatario | Trigger | Edge function (proposta) |
| --- | --- | --- | --- |
| Nuova prenotazione | ETS dell'esperienza | `INSERT` su `bookings` con `status = confirmed` | `send-booking-new-to-ets` |
| Cancellazione prenotazione | ETS dell'esperienza | `UPDATE` su `bookings` da `confirmed` a `cancelled` | `send-booking-cancelled-to-ets` |
| Invito al feedback | Dipendente | Cron a N giorni dall'evento, su `bookings.status = completed` senza review collegata | `send-feedback-invite` |

Le prime due chiudono il rischio operativo principale: oggi l'ETS scopre i partecipanti la mattina dell'evento. Le terza chiude il cerchio del feedback loop e alimenta il dato di soddisfazione che diventa visibile a HR.

Per le notifiche all'ETS, il destinatario è il `contact_email` dell'`associations` corrispondente all'esperienza prenotata.

**Decisione operativa N (giorni di delay invito feedback)**: da fissare. Valori realistici: 1-3 giorni dopo l'evento. Più tardi = tasso di risposta più basso; più presto = sensazione di "fretta". Da chiudere prima di scrivere la function `send-feedback-invite`.
