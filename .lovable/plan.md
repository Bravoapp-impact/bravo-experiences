## Refactor `VisibilityDialog.tsx` — modello Condivisa / Esclusiva

Allineo la UI al nuovo vincolo DB (trigger: un'esperienza `private` può avere al massimo 1 azienda nel bridge `experience_companies`). Modifico **solo** `src/components/super-admin/VisibilityDialog.tsx`. Props pubbliche invariate (`open`, `onOpenChange`, `experienceId`, `currentVisibility`, `companies`, `onSaved`) — `ExperiencesPage.tsx` continua a funzionare senza modifiche.

### Modello UI

- Toggle in alto: **Condivisa** / **Esclusiva** (RadioGroup orizzontale o due opzioni). Niente più `Switch` "privata".
- **Esclusiva** → "Visibile a una sola azienda, nessun'altra può vederla". Lista aziende renderizzata come **RadioGroup** (single select). Salvataggio bloccato finché nessuna azienda è scelta.
- **Condivisa** → "Visibile a tutte le aziende selezionate". Lista aziende come **Checkbox** multi-select (comportamento attuale). Zero selezioni = consentito.
- Titolo dialog: **"Visibilità e assegnazione"**.
- Search/filtro non richiesto (fuori scope).

### Stato interno

- `mode: 'shared' | 'exclusive'` (init da `currentVisibility === 'private'`).
- `selectedCompanyIds: Set<string>` per la modalità condivisa.
- `exclusiveCompanyId: string | null` per la modalità esclusiva.
- All'apertura: fetch da `experience_companies`, popolo entrambi gli stati (set completo + primo elemento come exclusive default).
- Al toggle mode: se passo a esclusiva e ho già 1+ aziende nel set, pre-seleziono la prima come `exclusiveCompanyId`; se passo a condivisa da esclusiva, includo l'azienda esclusiva nel set.

### Validazione

- `mode === 'exclusive' && !exclusiveCompanyId` → toast "Seleziona un'azienda per un'esperienza esclusiva", non chiamo Supabase.
- Pulsante "Salva" disabilitato in quel caso.

### Sequenza di salvataggio (ordine critico per il trigger)

1. `DELETE FROM experience_companies WHERE experience_id = :id` — azzero il bridge.
2. `UPDATE experiences SET visibility = :newVisibility WHERE id = :id` — `'private'` se esclusiva, `'public'` se condivisa.
3. `INSERT INTO experience_companies` con:
  - 1 riga `{ experience_id, company_id: exclusiveCompanyId }` se esclusiva,
  - N righe (anche 0) dal Set se condivisa.

Tutto in try/catch: se l'errore proviene dal trigger (messaggio italiano già definito DB-side), lo mostro così com'è nel toast `destructive` come fallback su `error.message`.

### Copy

- Titolo: "Visibilità e assegnazione"
- Opzione 1: **Condivisa** — "Visibile a tutte le aziende selezionate"
- Opzione 2: **Esclusiva** — "Visibile a una sola azienda, nessun'altra può vederla"
- Sezione lista (condivisa): "Aziende autorizzate"
- Sezione lista (esclusiva): "Azienda assegnata"
- Empty state: "Nessuna azienda disponibile"
- Toast successo: "Esperienza esclusiva aggiornata" / "Esperienza condivisa aggiornata"

### Mobile (~380px)

- Dialog mantiene `sm:max-w-[425px]`, su mobile occupa quasi full-width (default shadcn).
- RadioGroup verticale per il toggle Condivisa/Esclusiva su mobile (label + descrizione sotto) per evitare troncamenti delle descrizioni.
- Lista aziende già con `max-h-60 overflow-y-auto`.

### Out of scope (segnalo, non tocco, ma inserisco in [aperto.md](http://aperto.md) come punto da modificare successivamente)

- `ExperiencesPage.tsx` legge `experience.visibility === "private"` per badge/etichette ("Privata", "Pubblica"). Funziona perché il valore DB resta `public`/`private`. **Suggerimento per dopo**: rinominare le etichette UI in "Esclusiva"/"Condivisa" anche nella tabella per coerenza terminologica — ma non lo faccio in questo task.

### Test manuali da superare

1. Condivisa con N aziende → Esclusiva con 1 → save → DB: `visibility=private`, 1 riga bridge.
2. Esclusiva → cambio azienda → save → bridge aggiornato alla nuova azienda.
3. Esclusiva → Condivisa con 0 selezioni → save → `visibility=public`, 0 righe bridge.
4. Mobile 380px: toggle, liste e bottoni leggibili e cliccabili.