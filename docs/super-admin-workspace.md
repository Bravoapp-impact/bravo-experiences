# Super-admin Workspace

Piano di implementazione per riorganizzare la sezione super-admin del volontariato secondo il modello a 2 assi (`experiences.visibility` × `experience_dates.company_id`, vedi `volunteering.md` §4), allineandola in stile e profondità alle viste HR e ETS.
Da valutare anche come integrare questa sezione con tutte le altre operazioni eseguite dal super admin, anche sugli altri verticali.
La sezione infatti non deve semplicemente gestire il volontariato, ma tutto ciò che riguarda un'azienda specifica, oltre che il modello di funzionamento di tutta la piattaforma.
la sezione del super admin deve anche permettere di gestire ciò che viene fatto dalle associazioni.
Insomma, da valutare un refactor completo, che permetta una gestione più semplice e efficente.
Prima di scendere nel dettaglio, capire come impostare il flusso di alto livello: workspace dedicati per aziende? Per gli ETS? i flussi che hanno bisogno vs quelli che non hanno bisogno di interventi manuali.
Solo dopo, scendere nel dettaglio di ogni verticale e andare a modificare il funzionamento attuale.

---

## 1. Stato attuale della sezione volontariato e perché non funziona

Oggi la gestione super-admin del volontariato vive interamente in `/super-admin/experiences` come **lista con dialog sovrapposti**:

- `ExperienceEditDialog` per creare/modificare l'esperienza
- `ExperiencePreviewModal` per vedere come appare al dipendente
- `ExperienceDateDialog` per gestire le date di una singola esperienza
- `VisibilityDialog` per cambiare la modalità condivisa/esclusiva e assegnare aziende

`/super-admin/companies` è una **lista anagrafica e basta**. Non esiste una pagina di dettaglio per nessuna azienda. Lo stesso per le esperienze: nessun `/super-admin/experiences/:id`, l'unico "dettaglio" è il preview-modal.

Il workflow di attivazione di un programma per una nuova azienda è **invertito**: per attivare 10 esperienze ad HAVAS bisogna aprire 10 volte `VisibilityDialog` (una per esperienza) e aggiungere HAVAS in ognuno. Il centro di gravità operativo è l'esperienza, ma la realtà del business è che si parla in termini di company ("attiva il programma per HAVAS", "controlla cosa sta prenotando NEXI").

Inoltre l'`ExperienceDateDialog` non permette oggi di riservare una data a una specifica azienda — il campo `company_id` esiste a DB ma non è esposto in UI. Manca quindi l'azione operativa centrale del modello a 2 assi: solo il super-admin può valorizzare `experience_dates.company_id` (RLS impedisce all'ETS di farlo) ma oggi non ha l'UI per farlo.

---

## 2. Cosa cambia, in sintesi

Inversione del centro di gravità: **company-first**. Un workspace dedicato per ogni azienda diventa l'hub centrale di tutte le operazioni che la riguardano (programma volontariato, anagrafica, hour budget, dipendenti, Team Building). La pagina esperienza diventa il dettaglio pieno (al posto dei dialog sovrapposti). La lista esperienze si semplifica, diventando un indice navigazionale.

Tre nuove route, una rifatta, una semplificata:

| Route                          | Stato        | Cosa è                                                    |
| ------------------------------ | ------------ | --------------------------------------------------------- |
| `/super-admin/companies/:id`   | **Nuova**    | Workspace company — hub operativo per una singola azienda |
| `/super-admin/experiences/:id` | **Nuova**    | Dettaglio esperienza pieno, in stile HR/ETS               |
| `/super-admin/experiences`     | Semplificata | Indice piatto, solo righe + filtri                        |
| `/super-admin/companies`       | Invariata    | Lista, ma le righe linkano al workspace                   |
| `ExperienceDateDialog`         | Esteso       | Aggiunge campo "Disponibile a"                            |

---

## 3. Il piano in 4 step

Ordine pensato per **non rompere mai il flusso operativo esistente**: prima si abilita la nuova azione mancante (Step 1), poi si costruiscono le nuove pagine senza rimuovere niente (Step 2 e 3), poi si rimuovono i dialog vecchi (Step 4).

### Step 1 — Esporre `company_id` in `ExperienceDateDialog`

L'azione operativa più semplice e isolata. Sblocca subito il modello a 2 assi senza dipendenze su pagine nuove.

**Cosa cambia.**

- Nuovo campo nel dialog: **"Disponibile a"** (RadioGroup)
  - "Tutte le aziende che hanno l'esperienza" → `company_id = NULL`
  - "Solo a una specifica azienda" → mostra select con la lista delle aziende attivate per quell'esperienza (`experience_companies` filtrato)
- Se l'esperienza è `private`, la radio è bloccata su "Solo a…" con preselezionata l'unica azienda nel bridge (e disabilitata, perché c'è una sola scelta possibile).
- Persistenza: il payload `INSERT`/`UPDATE` su `experience_dates` passa `company_id`.
- Stati: caricamento elenco aziende dell'esperienza in parallelo con il fetch della data esistente; empty state se l'esperienza non ha ancora aziende nel bridge (con messaggio: "Attiva prima questa esperienza per almeno un'azienda dal workspace company o dal dialog visibilità").

**File toccati.** `src/components/super-admin/ExperienceDateDialog.tsx`.

**Test manuali.**

- Esperienza condivisa, data NULL → resta NULL.
- Esperienza condivisa, data con `company_id` esistente → preselezionato corretto.
- Cambio da "Tutte" a "Solo a" senza selezionare azienda → blocco salvataggio con toast.
- Esperienza esclusiva → radio bloccata, select disabilitato sulla sola azienda.
- HR e dipendenti dell'azienda riservata vedono la data; HR e dipendenti di un'altra azienda **non** la vedono (verifica RLS `hr_view_experience_dates_v5` / `employees_view_dates_v3`).

### Step 2 — Workspace company `/super-admin/companies/:id`

L'hub. Una pagina sola, piatta, divisa in sezioni `PageSection` (no Card wrapper, regola unica vedi `design-system.md`).

**Sezioni proposte (v1, scope volontariato).**

1. **Header** — `PageHeader` con logo company + nome + breadcrumb "Aziende / {Nome}" + azioni (`Modifica anagrafica`, `Disattiva`).
2. **Anagrafica** — `PageSection` con i campi di `companies` (nome, max_concurrent_absences, logo). Editabile inline o tramite `CompanyEditDialog` esistente, da decidere (vedi §5).
3. **Hour budget** — `PageSection` con la riga di `hour_budgets` per la company (`hours_per_employee_year`, `fiscal_year_start`). CRUD inline. Empty state se non c'è budget configurato.
4. **Programma volontariato** — la sezione operativa principale. Lista delle esperienze attivate per la company (`experience_companies` join `experiences`). Per ogni riga:
   - Titolo esperienza, ETS, città, badge `Condivisa`/`Esclusiva`
   - **N. date riservate** alla company (`experience_dates.company_id = this_company`) + **N. date aperte ereditate** (`company_id IS NULL` sull'esperienza)
   - **N. partecipanti totali** (`bookings` confermati o completati su `experience_dates` dell'esperienza, filtrati per dipendenti della company)
   - Click sulla riga → `/super-admin/experiences/:id` (Step 3)
   - Azioni: rimuovi dal programma (DELETE su `experience_companies`), aggiungi nuova esperienza al programma (apre un picker che mostra le esperienze `published` non ancora attivate; rispetta il trigger di esclusività — esperienze `private` già assegnate ad altra company sono disabilitate con tooltip).
5. **Dipendenti** — `PageSection` con il count e link a `/super-admin/users?company={id}` (oppure tabella embedded compatta con i primi N e link "Vedi tutti"). Da chiudere in §5.
6. **(Futuro) Team building** — placeholder con count richieste TB della company e link a `/super-admin/team-building/richieste?company={id}`. Lasciato fuori dalla v1 se aggiunge complessità, vedi §5.

**File nuovi.** `src/pages/super-admin/CompanyWorkspacePage.tsx`, sezioni in `src/components/super-admin/company-workspace/`.

**Route.** Da registrare in `src/App.tsx` sotto `ProtectedSuperAdminRoute`.

**Lista companies.** `CompaniesPage.tsx`: la riga clicca a `/super-admin/companies/:id`. Il dialog `CompanyEditDialog` resta per ora (vedi §5 sull'edit inline vs. dialog).

### Step 3 — Dettaglio esperienza `/super-admin/experiences/:id`

Sostituisce il combo `ExperienceEditDialog` + `ExperiencePreviewModal`. Una pagina unica, coerente con `/hr/experiences/:id` e `/association/experiences/:id` per stile e densità.

**Sezioni proposte.**

1. **Header** — titolo, ETS, città, status (`draft`/`published`/`archived`), badge `Condivisa`/`Esclusiva`. Azioni: `Modifica`, `Archivia`, breadcrumb "Esperienze / {Titolo}".
2. **Visibilità e assegnazione** — toggle inline "Condivisa"/"Esclusiva" (sostituisce `VisibilityDialog`). Sotto al toggle:
   - In modalità Condivisa: lista checkbox delle aziende attive con add/remove diretti.
   - In modalità Esclusiva: select singola con l'azienda assegnata.
   - **Gestione errori trigger DB.** Il cambio da `public` a `private` con >1 aziende nel bridge fallisce per il trigger `enforce_private_single_company_on_experiences`. UI: messaggio chiaro ("Per rendere questa esperienza esclusiva, lascia una sola azienda nell'elenco — attualmente ne hai N"). Stessa cosa per INSERT su `experience_companies` quando `private`: tooltip su "Aggiungi azienda" disabilitato.
3. **Date** — embed di una mini-tabella `experience_dates` con `company_id` esposto (badge "Aperta a tutte" o "Solo {Nome azienda}"), e CTA "Nuova data" che apre `ExperienceDateDialog` aggiornato (Step 1).
4. **Contenuto** — campi della scheda (description, image_url, sdgs, secondary_tags, participant_info, ecc.) editabili inline o tramite `EditExperienceDialog` riusato. Da chiudere in §5.
5. **Storico** — prenotazioni (`bookings` aggregati) + recensioni (`experience_reviews`). Read-only, lazy load.

**File nuovi.** `src/pages/super-admin/ExperienceDetailPage.tsx`, sezioni in `src/components/super-admin/experience-detail/`.

**Route.** Da registrare in `src/App.tsx`.

**`VisibilityDialog`.** Resta disponibile (chiamato dalla lista esperienze) finché lo Step 4 non lo deprezza. La logica di salvataggio (DELETE bridge → UPDATE visibility → INSERT bridge) viene riusata, estratta in un hook condiviso `useUpdateExperienceVisibility` se il dettaglio la riutilizza.

### Step 4 — Cleanup della lista `/super-admin/experiences`

Una volta che Step 2 e 3 sono completi e testati in produzione, la lista esperienze diventa un **indice navigazionale** puro.

**Cosa cambia.**

- Rimosse le date inline dalle righe (oggi mostrate in expand). Le date si gestiscono dal dettaglio.
- Rimossi `ExperienceEditDialog` (sostituito da modifica nel dettaglio) e `ExperiencePreviewModal` (sostituito dal dettaglio stesso, che ha già la sezione contenuto).
- `VisibilityDialog` rimosso dalla lista (la visibilità si cambia dal dettaglio o dal workspace company).
- Click sulla riga → `/super-admin/experiences/:id`.
- Rimangono in lista: filtri (ETS, città, status, visibilità), colonne essenziali (titolo, ETS, città, status, badge visibilità, count date, count aziende attive). Layout piatto `PageSection`, header `bg-muted/50`.

**File toccati.** `src/pages/super-admin/ExperiencesPage.tsx` (semplificato), eliminazione di `ExperienceEditDialog.tsx`, `ExperiencePreviewModal.tsx`, eventuale deprecazione di `VisibilityDialog.tsx` (se non chiamato da nessun'altra parte).

**Vincolo di sequenza.** Step 4 si fa **solo dopo** che il dettaglio (Step 3) è completo, navigabile e copre il 100% delle azioni che oggi vivono nei dialog. Non si tocca la lista finché c'è anche solo un'azione che il dettaglio non sa fare.

---

## 4. Vincoli tecnici trasversali

**Trigger DB di esclusività.** Vedi `volunteering.md` §4. Tutte le operazioni che toccano `experiences.visibility` o `experience_companies` devono gestire l'errore del trigger con un toast in italiano comprensibile (non l'errore Postgres grezzo). Pattern: try/catch sull'operazione, se il messaggio di errore contiene `enforce_private_experience_single_company`, mostrare un toast contestuale.

**RLS.** Il super-admin ha `is_super_admin(auth.uid())` su tutte le tabelle volontariato — nessuna restrizione lato SELECT/INSERT/UPDATE/DELETE. Non servono RPC dedicate per questo flusso.

**Sequenza salvataggio visibilità.** Sempre DELETE bridge → UPDATE visibility → INSERT bridge (vedi `VisibilityDialog` attuale). Estrarre in hook condiviso quando il dettaglio la riutilizza.

**Design system.** Pagine flat, `PageSection` invece di `Card`, header standard `PageHeader` con icona/colore coerente con la sidebar. Tabelle senza wrapper Card, header riga `bg-muted/50`. Vedi `design-system.md` e memory `mem://style/card-vs-flat-section`.

**Mobile.** Le pagine super-admin sono desktop-first. Non serve breakpoint mobile dedicato per questa sessione.

---

## 5. Punti aperti da chiudere prima di iniziare

Due decisioni di prodotto che impattano lo scope dello Step 2 e Step 3.

### 5.1 Cosa include esattamente il workspace company (Step 2)

Tre opzioni:

- **A — Solo volontariato.** Anagrafica + hour budget + programma volontariato + count dipendenti. TB resta fuori, accessibile da `/super-admin/team-building/richieste` con filtro company.
- **B — Volontariato + slot TB.** Aggiunge una sezione "Team building" con il count delle richieste TB della company e link alla case list filtrata.
- **C — Hub completo.** Volontariato + TB con tabelle embedded delle richieste, possibilità di creare una nuova richiesta TB dal workspace, dipendenti gestiti inline.

Raccomandazione: partire con **A** per non far esplodere lo scope di una sessione. **B** si aggiunge in 30 minuti quando le richieste TB iniziano a essere frequenti. **C** è una v2 da fare quando il workspace è in produzione e si capisce quali azioni si vorrebbero davvero fare da lì.

### 5.2 Quanto è denso il dettaglio esperienza (Step 3)

Due opzioni:

- **A — Long page.** Tutte le sezioni (visibilità, date, contenuto, storico) una sotto l'altra in scroll, separate da `PageSection`. Pattern coerente con il workspace company. Pro: stile uniforme, una sola pagina, niente switch contesto. Contro: pagina lunga se ci sono molte date o molte recensioni.
- **B — Tab interne.** Header sticky + tab tipo `Visibilità · Date · Contenuto · Storico`. Pro: pagina più corta, ogni tab ha il suo focus. Contro: introduce un pattern nuovo che oggi non esiste in altre pagine super-admin.

Raccomandazione: **A** per la v1, coerente con il resto. Se la pagina diventa effettivamente troppo lunga in produzione, si introducono tab in un secondo momento.

### 5.3 Edit anagrafica / contenuto esperienza: inline o dialog?

Sia per `companies` (anagrafica) che per `experiences` (contenuto), va deciso se i campi si modificano inline nel workspace/dettaglio o se restano dialog separati (`CompanyEditDialog`, `EditExperienceDialog`).

Raccomandazione: **dialog separati riusati** per la v1 (zero refactor delle form esistenti, zero rischio di regressione). Inline è una raffinazione successiva, quando si capisce quali campi vengono toccati spesso.

---

## 6. Riepilogo decisioni e prossimi passi

- Inversione del modello: **company-first**, non più experience-first.
- 4 step in ordine: estendere `ExperienceDateDialog` → workspace company → dettaglio esperienza → cleanup lista.
- Vincolo invariante: lo Step 4 (cleanup) si fa **solo dopo** che il dettaglio copre tutte le azioni dei dialog rimossi.
- 3 decisioni aperte (§5) da chiudere prima dello Step 2.
- Trigger DB di esclusività: gestire l'errore con toast in italiano, non far filtrare il messaggio Postgres.

Una volta chiuse le decisioni di §5, si parte dallo Step 1 (isolato, sicuro, sblocca subito il modello a 2 assi).
