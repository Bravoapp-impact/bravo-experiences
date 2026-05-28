# Annullamento prenotazioni: da 48 ore a 14 giorni

## 1. Database — funzione `is_booking_cancellable`

Oggi la RLS `Users can cancel own bookings if allowed` su `bookings` usa la funzione SQL `public.is_booking_cancellable(uuid)` che fa:

```sql
ed.start_datetime > (now() + interval '48 hours')
```

Migration: ridefinire la funzione con `interval '14 days'`. Stessa firma, stessa policy resta valida → nessun altro intervento RLS necessario.

Nota: la RLS `users_create_bookings_v3` (INSERT) non è impattata. La policy UPDATE continua a permettere solo il cambio status → `cancelled` da parte del proprietario, ma solo se la finestra è aperta. Perfetto.

## 2. Frontend — `src/components/bookings/BookingDetailModal.tsx`

Cambi:

- Calcolo: sostituire `hoursUntilEvent > 48` con `daysUntilEvent >= 14` (usare `differenceInDays` di date-fns, o `hoursUntilEvent >= 14*24`). Calcolare anche la **data limite di annullamento** = `startDate - 14 giorni` (per mostrarla all'utente).
- Per **prenotazioni future confermate**, mostrare sempre (anche quando il bottone di annullamento è ancora attivo) una riga informativa chiara con la regola dei 14 giorni e la data limite, ad es.:
  > "Puoi annullare la prenotazione fino al **{data}** (14 giorni prima dell'evento)."
  La posizione naturale è subito sopra il box "In caso di imprevisto", così è visibile a colpo d'occhio e non solo dentro al riquadro grigio.
- Aggiornare il testo del riquadro "In caso di imprevisto": sostituire "meno di 48 ore dall'evento" con "meno di 14 giorni dall'evento".
- Aggiornare il blocco mostrato quando `canCancel` è false ma la prenotazione è ancora futura confermata ("Non è più possibile annullare la prenotazione"): spiegare il motivo e invitare a scrivere a [team@bravoapp.it](mailto:team@bravoapp.it). Esempio:
  > "La finestra di annullamento online si è chiusa (è possibile fino a 14 giorni prima dell'evento). Per gestire la richiesta scrivi a [team@bravoapp.it](mailto:team@bravoapp.it)."

## 3. File NON toccati

- `src/lib/booking-utils.ts` → `isBookingCancellable(status)` controlla solo lo status, non il tempo. Nessuna modifica funzionale. Aggiorno solo il commento header del file ("48h cancellation" → "14 days cancellation") per coerenza documentale.
- `src/pages/MyBookings.tsx` → nessun riferimento a 48h.
- `send-booking-reminders` usa 48 in tutt'altro contesto (lookahead reminder), non si tocca.

## Note tecniche

- Migration: `CREATE OR REPLACE FUNCTION public.is_booking_cancellable(...)` con `interval '14 days'`. Mantiene `SECURITY DEFINER`, `STABLE`, `search_path = public`.
- Componente: nessuna modifica ai dati passati, solo logica di rendering e copy. Usare `format(deadline, "EEEE d MMMM", { locale: it })` per la data limite.