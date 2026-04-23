

## Piano: Modifiche al wizard TB e aggiornamento documentazione

### Modifica 1 — Partecipanti: da range a singolo numero indicativo

**Cosa cambia:** Lo step 4 attualmente chiede min e max separati. Diventerà un singolo campo numerico ("Quante persone pensi parteciperanno?"). Sotto l'input, quando l'utente inserisce un numero (es. 50), viene mostrato un testo informativo: "Range stimato: 45 – 55 partecipanti" (±10%).

**Dettagli tecnici:**
- Rimuovere `participantsMin` e `participantsMax` dal form state, sostituire con `participantsCount: string`
- Calcolare min/max automaticamente al submit: `Math.round(N * 0.9)` / `Math.round(N * 1.1)`
- Aggiornare `canNext()` per step 4: basta che `participantsCount` sia > 0
- Il DB riceve sempre `participants_min` e `participants_max` calcolati dal singolo valore

### Modifica 2 — Luoghi: selezione multipla e rinominare da "provincia" a "luogo"

**Cosa cambia:** Attualmente si seleziona una sola provincia. Diventa multi-select: l'utente può scegliere più luoghi dalla lista province italiane. L'etichetta diventa "In quale/i luogo/i vorresti organizzare l'evento?".

**Dettagli tecnici:**
- Rinominare `province: string` → `places: string[]` nel form state
- La lista rimane `ITALIAN_PROVINCES` ma le voci si selezionano/deselezionano con checkbox (come i goals)
- Mostrare i luoghi selezionati come badge sotto la barra di ricerca
- Aggiornare `canNext()` per step 5: richiede `places.length > 0`
- Al submit, salvare array in `extra_services.places` (al posto di `extra_services.province`)

### Modifica 3 — Rimuovere selezione tipologia location (indoor/outdoor)

**Cosa cambia:** Eliminare completamente il blocco Select per "Tipologia location" dallo step 5.

**Dettagli tecnici:**
- Rimuovere `locationType` dal form state e da `initialForm`
- Rimuovere il blocco JSX del Select indoor/outdoor
- Rimuovere dalla validazione `canNext()` step 5 il check su `locationType`
- Non inviare più `preferred_location_type` al DB nel submit

### Modifica 4 — Aggiornamento `docs/tb-flow.md`

Aggiornare la sezione 3.2 (`tb_requests`) e la Fase 1 del flusso per riflettere:
- Il brief raccoglie un singolo numero indicativo di partecipanti (il range viene calcolato ±10%)
- La selezione del luogo è multi-provincia (non singola)
- La tipologia location (indoor/outdoor) non viene più raccolta nel brief HR (resta nei `tb_formats` per il catalogo)

### File coinvolti

- `src/pages/hr/HRNewTBRequestPage.tsx` — tutte le modifiche UI e logica
- `docs/tb-flow.md` — aggiornamento documentazione

