

# Fix click propagation nel calendario

## Problemi identificati

1. **PopoverContent in Portal**: Radix Popover renderizza il contenuto in un Portal. Quando il popover si chiude (click su X o click esterno), il click "cade" sulla cella del giorno sottostante, triggerando `handleDayClick`.

2. **MonthView naviga a DayView per giorni con eventi**: `handleDayClick` (riga 52-54) cambia vista a "giorno" quando ci sono eventi. Ma l'utente vuole aprire il popover dell'evento, non navigare. La navigazione a day view dovrebbe avvenire solo tramite il pulsante "+N in più".

## Correzioni

### MonthView.tsx
- Rimuovere la logica che switcha a day view in `handleDayClick` per giorni con eventi. Per giorni con eventi, il click sulla cella non fa nulla (gli eventi hanno già i popover). Per giorni vuoti, continua ad aprire ManageDatesDialog.
- Aggiungere un pulsante cliccabile sul numero del giorno per navigare a day view (opzionale, se si vuole mantenere la navigazione).

### DayDetailPopover.tsx
- Aggiungere `onPointerDownOutside` e `onInteractOutside` sul `PopoverContent` con `e.preventDefault()` per evitare che la chiusura del popover propaghi il click agli elementi sottostanti. Questo è il pattern Radix consigliato per prevenire il "click-through".

## File coinvolti

| File | Modifica |
|------|----------|
| `src/components/association/calendar/MonthView.tsx` | Fix `handleDayClick`: giorni con eventi non navigano più a day view |
| `src/components/association/calendar/DayDetailPopover.tsx` | Aggiungere `onInteractOutside` con stopPropagation su PopoverContent |

