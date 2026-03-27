

# Piano: Ristrutturazione HR Volontariato aziendale

## Panoramica

Rinominare la route, ristrutturare HRExperiencesPage con 3 tab (Catalogo, Il mio programma, Statistiche), e riutilizzare il pattern `ExperienceCompactCard` dall'AssociationExperiencesPage.

## 1. Route e navigazione

**`App.tsx`**: cambiare `/hr/experiences` → `/hr/volontariato`

**`HRLayout.tsx`**: aggiornare href da `/hr/experiences` a `/hr/volontariato`

**`HRHomePage.tsx`**: aggiornare `navigate("/hr/experiences")` → `navigate("/hr/volontariato")`

## 2. Riscrittura HRExperiencesPage.tsx

La pagina diventa un componente con 3 tab gestite da Radix Tabs.

### Stato condiviso
- `activatedIds: useState<Set<string>>` — inizializzato al mount dalla query `experience_companies` dove `company_id = profile.company_id`
- `experiences` — tutte le esperienze published/public (fetch come oggi, la RLS filtra per service_type)
- `categories`, `cities` — per i filtri

### Fetch al mount (parallelo)
1. Esperienze: query attuale su `experiences` con join su categories, cities, associations
2. `experience_companies` con `company_id = profile.company_id` → costruisce `Set<string>` di `experience_id`
3. Categories e cities per i filtri

### Tab "Catalogo"
- Filtri sopra: search per titolo, select categoria, select città
- Grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`
- Card: riusa il pattern `ExperienceCompactCard` (BaseCardImage square, titolo 13px, categoria · città 11px, riga azioni)
- Azioni per card:
  - Se `activatedIds.has(exp.id)`: icona `CheckCircle2` verde con tooltip "Nel programma" (non cliccabile)
  - Altrimenti: icona `Plus` con tooltip "Aggiungi al programma" → insert in `experience_companies`, aggiorna `activatedIds` ottimisticamente

### Tab "Il mio programma" (badge con `activatedIds.size`)
- Filtra `experiences` dove `activatedIds.has(exp.id)`
- Stesso grid e card
- Azioni:
  - `Eye` "Anteprima" → apre modale preview (riusa il pattern dalla AssociationExperiencesPage: BaseModal con immagine, badge categoria, titolo, descrizione, location, SDGs)
  - `Trash2` "Rimuovi dal programma" → delete da `experience_companies`, aggiorna `activatedIds`
- Empty state: `PackageOpen`, "Nessuna esperienza attiva", "Vai al Catalogo per aggiungere esperienze al programma"

### Tab "Statistiche"
- Contenuto identico all'attuale HRExperiencesPage: `HRExperienceMetrics`, `HRExperienceFilters`, lista `HRExperienceCard`
- Mantiene tutta la logica di fetch attuale per dates/bookings (lazy: fetcha solo quando si apre questa tab)
- Le metriche usano solo le esperienze in `activatedIds` (filtra `experiences` attivate)

### Header
- Titolo: "Volontariato aziendale"
- Descrizione: "Gestisci il programma e monitora l'impatto"
- Nessun bottone

## 3. Componenti riutilizzati / creati

Il `ExperienceCompactCard` e i sub-component (ActionButton, preview modal) della AssociationExperiencesPage verranno **ricopiati come componenti locali** dentro HRExperiencesPage, con azioni semplificate per il contesto HR. Non si modifica AssociationExperiencesPage.

## File coinvolti

| File | Modifica |
|------|----------|
| `src/App.tsx` | Route `/hr/experiences` → `/hr/volontariato` |
| `src/components/layout/HRLayout.tsx` | href sidebar |
| `src/pages/hr/HRHomePage.tsx` | navigate path |
| `src/pages/hr/HRExperiencesPage.tsx` | Riscrittura completa |

Nessuna modifica a database, RLS, o edge functions. Le RLS su `experience_companies` già permettono a HR admin di fare INSERT e DELETE per la propria azienda.

