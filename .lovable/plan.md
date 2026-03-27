

# Piano: Statistiche basate su booking storici, non su activatedIds

## Problema
`fetchStatsData` filtra le esperienze usando `activatedIds` (riga 168). Se un'esperienza viene rimossa dal programma, i dati storici (ore, partecipazioni, beneficiari) spariscono dalle statistiche.

## Soluzione
Cambiare la logica di fetch della tab Statistiche: invece di partire dalle esperienze attivate, partire dai **booking dei dipendenti dell'azienda** e risalire alle esperienze tramite le date.

## Modifica in `HRExperiencesPage.tsx`

Riscrivere `fetchStatsData`:

1. Recuperare tutti i profili dell'azienda (come oggi)
2. Recuperare tutti i booking dei dipendenti dell'azienda (qualsiasi stato tranne `cancelled`)
3. Dai booking, ottenere le `experience_dates` e da quelle gli `experience_id` unici
4. Recuperare i dettagli delle esperienze corrispondenti (query diretta su `experiences` con `.in("id", uniqueExpIds)`)
5. Costruire `statsExperiences` da questi dati

Questo approccio garantisce che:
- Esperienze passate con booking completati appaiano sempre nelle statistiche
- La rimozione dal programma non cancelli lo storico
- Le metriche (ore, partecipazioni, fill rate) restino accurate

## Rimozione dipendenza da activatedIds
La riga `const activatedList = experiences.filter((e) => activatedIds.has(e.id))` viene eliminata. Il fetch delle statistiche diventa completamente indipendente dallo stato del programma attivo.

## File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/hr/HRExperiencesPage.tsx` | Riscrittura di `fetchStatsData` |

1 file, logica di fetch stats.

