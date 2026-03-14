

# Piano: Rimuovere click-to-create dalle celle + Bottone "+" nel header

## Problema
Il click sulle celle del calendario (in tutte le viste) propaga attraverso i popover causando aperture accidentali. La soluzione migliore e' eliminare completamente il click-to-create dalle celle e spostare la creazione su un bottone dedicato.

## Modifiche

### 1. CalendarHeader.tsx — Aggiungere bottone "+"
- Aggiungere un `Button` con icona `Plus` accanto al toggle Mese/Settimana/Giorno
- Nuovo prop `onAddDate: () => void` che triggera il picker esperienza nella page

### 2. AssociationCalendarPage.tsx — Spostare logica creazione sul bottone
- Passare `onAddDate` al `CalendarHeader` che apre il picker esperienza (o direttamente `ManageDatesDialog` se c'e' una sola esperienza)
- Rimuovere `onEmptyDayClick` e `handleEmptyDayClick` dalle props passate alle viste
- Rimuovere l'inline experience picker modal (quello con overlay nero) e sostituirlo con un dialog/select piu' pulito dentro la stessa logica

### 3. MonthView.tsx — Rimuovere click-to-create
- Rimuovere `onEmptyDayClick` dalle props
- Rimuovere `handleDayClick` e il click handler sulla cella (`onClick`)
- Rimuovere l'icona `Plus` dai giorni vuoti
- Le celle non sono piu' cliccabili (rimuovere `cursor-pointer`); solo gli `EventBlock` dentro i popover restano interattivi

### 4. WeekView.tsx — Rimuovere click-to-create
- Rimuovere `onEmptySlotClick` dalle props
- Rimuovere `onClick` dalla colonna giorno (riga 79)
- Rimuovere `cursor-pointer` dalle celle orarie

### 5. DayView.tsx — Rimuovere click-to-create
- Rimuovere `onEmptySlotClick` dalle props
- Rimuovere `onClick` dal container eventi (riga 79)
- Rimuovere `cursor-pointer` dalle celle orarie

## File coinvolti

| File | Modifica |
|------|----------|
| `CalendarHeader.tsx` | Aggiungere bottone "+" con prop `onAddDate` |
| `AssociationCalendarPage.tsx` | Spostare logica creazione sul bottone, rimuovere `onEmptyDayClick` dalle viste |
| `MonthView.tsx` | Rimuovere click handler celle, icona Plus, prop `onEmptyDayClick` |
| `WeekView.tsx` | Rimuovere click handler celle, prop `onEmptySlotClick` |
| `DayView.tsx` | Rimuovere click handler celle, prop `onEmptySlotClick` |

