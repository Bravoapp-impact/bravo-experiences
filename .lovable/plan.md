# Avviso di conferma per prenotazioni entro 14 giorni

## Obiettivo
Nel flusso di prenotazione da `ExperienceDetail.tsx`, se la data selezionata cade entro 14 giorni da oggi, mostrare un AlertDialog di conferma esplicita prima di scrivere il booking. Oltre i 14 giorni, comportamento invariato (prenotazione diretta).

## Modifiche

**File: `src/pages/ExperienceDetail.tsx`**

1. Aggiungere import di `AlertDialog` da shadcn e di `differenceInDays` da `date-fns`.
2. Aggiungere stato `confirmCancellableOpen: boolean`.
3. Calcolare, al click su "Conferma" nel drawer, i giorni fino alla data selezionata (usando `selectedDateId` → trovo la `experience_date` corrispondente in `dates`).
   - Se `daysUntil < 14` → aprire l'AlertDialog invece di chiamare `handleBook` direttamente.
   - Altrimenti → invocare direttamente `handleBook` (comportamento attuale).
4. Nuovo AlertDialog con:
   - Titolo: "Confermi la prenotazione?"
   - Descrizione: "Questa esperienza si svolge entro 14 giorni. Confermando, non potrai più annullare la prenotazione online. Vuoi procedere?"
   - Azioni: "Annulla" (chiude il dialog, resta nel drawer) / "Conferma prenotazione" (chiama `handleBook` e chiude il dialog).
5. Nessuna modifica al backend: la regola dei 14 giorni è già enforced dalla funzione `is_booking_cancellable` lato DB.

## Note tecniche
- La costante `CANCELLATION_WINDOW_DAYS = 14` viene riusata localmente (coerente con `BookingDetailModal.tsx`).
- Il confronto usa l'inizio del giorno dell'esperienza vs `now()` per coerenza con la logica DB (`event_start_at - interval '14 days' > now()`). Usiamo `differenceInHours` >= 14*24 per evitare ambiguità di fuso.
- Nessun cambiamento per HR/Super Admin né per altre route.
