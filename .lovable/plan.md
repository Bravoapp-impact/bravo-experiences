# Piano: Pagina HR "Team Building Sociali" — Landing + Brief Guidato

## Panoramica

Creare la pagina `/hr/team-building` che l'HR vede cliccando "Team building sociali" nella sidebar. La pagina ha una missione chiara: guidare l'HR a compilare il **brief** che genera una `tb_request`. Se non ci sono richieste attive, la pagina mostra un unico CTA per iniziare il percorso guidato. Se ci sono richieste esistenti, mostra la lista con stati e azioni contestuali.

In questa prima iterazione ci concentriamo sulla **landing page** e sul **form di brief guidato** (Fase 1 del flusso TB).

---

## Struttura della pagina

### Stato "nessuna richiesta" (empty state)

Pagina pulita, centrata, con:

- Illustrazione/icona evocativa
- Titolo: "Organizza il team building sociale perfetto per il tuo team"
- Sottotitolo breve che spiega il processo: "Raccontaci cosa cerchi e ti proporremo le idee migliori per il tuo team"
- Un unico bottone primario: "Inizia ora"
- Il bottone apre il form guidato a step

### Stato "con richieste esistenti"

- Header con bottone "Nuova richiesta"
- Lista card delle `tb_requests` dell'azienda, con: titolo, stato (badge colorato), data creazione, CTA contestuale
- Click su card → futura pagina dettaglio (per ora solo navigazione predisposta)

### Form di **brief** guidato (multi-step)

Form modale o pagina dedicata (`/hr/team-building/nuova-richiesta`) a step, con progress indicator. Ogni step raccoglie un pezzo del brief mappato ai campi di `tb_requests`:

**Step 1 — Il tuo evento**

- `title` — nome identificativo (es. "TB Primavera - Team Marketing")
- Copy di supporto: "Dai un nome a questo evento. Es: "TB Primavera - Team Marketing""

**Step 2 — Obiettivo da raggiungere**

- Copy di supporto: "Che obiettivo/i vuoi raggiungere con [`title`]?"
- `goal` -- multi-select fra i seguenti:
  - Sviluppare competenze e soft skills
  - Promuovere l'impegno per la sostenibilià ambientale
  - Rafforzare lo spirito di squadra e il team
  - Migliorare il clima aziendale e il senso di appartenenza
  - Lavorare sui valori dell'inclusione e diversità
  - Ridurre le barriere e le gerarchie aziendali
  - Facilitare l'incontro e la conoscenza reciproca
  - Vivere un momento di benessere e svago
  - Potenziare l'immagine dell'azienda

**Step 3 — Punto di partenza**

- Copy di supporto: "Hai già in mente qualche attività per il tuo team?"
- `preferred_activities`  -- multi select  delle [categorie + descrizioni delle categorie] + opzione "Non ho ancora nessuna attività in mente"

**Step 4 — Partecipanti**

- `participants_min` / `participants_max` — range con due input numerici
- Copy di supporto: "Indica il range di persone che pensi parteciperanno all'evento"

**Step 5 — Quando e dove**

- Copy di supporto: "Seleziona quando e dove vorresti realizzare l'evento"

- `preferred_period_from` / `preferred_period_to` — date picker per range
- `preferred_city_id` — select dalle città disponibili
- `preferred_location_type` — scelta tra Indoor / Outdoor / Indifferente

**Step 6 — Budget e servizi**

- `budget_estimate` — input numerico con placeholder "Budget indicativo in €"
- `extra_services` — checkbox per: Pranzo, Trasporto, Noleggio location, Catering sociale
- `notes` — textarea per note libere

**Step 5 — Riepilogo e invio**

- Recap visivo di tutte le risposte
- Bottone "Invia richiesta" → INSERT in `tb_requests` con `status = 'submitted'`
- Toast di conferma + redirect alla lista

&nbsp;

Il campo `description` non viene compilato, non chiediamo all'utente di scrivere nulla.

---

## Passi di implementazione

### 1 — RLS per HR su tb_requests (nessuna modifica necessaria)

Le policy RLS per INSERT, SELECT e UPDATE su `tb_requests` filtrate per `company_id` sono già in posto. Nessuna migrazione DB necessaria.

### 2 — Abilitare la voce sidebar

In `HRLayout.tsx`, cambiare la voce "Team building sociali" da `disabled: true, href: "#"` a `href: "/hr/team-building"`, rimuovere `disabled` e `badge: "Presto"`.

### 3 — Creare la pagina principale

Nuovo file `src/pages/hr/HRTeamBuildingPage.tsx`:

- Fetch delle `tb_requests` dell'azienda (la RLS filtra automaticamente)
- Empty state se nessuna richiesta
- Lista card se ci sono richieste
- Bottone per aprire il **brief**

### 4 — Creare il form di **brief**

Nuovo file `src/components/hr/TBBriefWizard.tsx`:

- Componente multi-step con state interno
- Fetch delle città per il select (dalla tabella `cities`)
- Validazione per step con zod
- Al submit: INSERT in `tb_requests` con `company_id` e `requested_by` dall'auth context

### 5 — Aggiungere la route

In `App.tsx`, aggiungere la route `/hr/team-building` protetta con `ProtectedHRRoute`.

---

## File coinvolti


| File                                  | Modifica                      |
| ------------------------------------- | ----------------------------- |
| `src/components/layout/HRLayout.tsx`  | Abilitare voce sidebar        |
| `src/pages/hr/HRTeamBuildingPage.tsx` | **Nuovo** — pagina principale |
| `src/components/hr/TBBriefWizard.tsx` | **Nuovo** — form multi-step   |
| `src/App.tsx`                         | Aggiungere route              |


Nessuna migrazione DB. Nessuna modifica RLS.