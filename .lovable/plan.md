## Cosa cambia

Due ritocchi di copy. Nessuna modifica a schema DB, RLS, o infrastruttura email.

### 1. Titolo unificato "Volontariato con Bravo! - <nome esperienza>"

Si applica in tre punti che oggi mostrano varianti diverse del titolo:

**a) Subject email di conferma prenotazione**
`supabase/functions/_shared/transactional-email-templates/booking-confirmation.tsx` (riga 164-165)

Da:
```ts
subject: (data) => `Conferma prenotazione: ${data?.experienceTitle || 'la tua esperienza'}`
```
A:
```ts
subject: (data) => `Volontariato con Bravo! - ${data?.experienceTitle || 'la tua esperienza'}`
```

**b) Evento Google Calendar (deep-link)**
`supabase/functions/send-booking-confirmation/index.ts`, funzione `buildGoogleCalendarUrl` (riga 54-56).

Oggi compone il titolo come `"<title> · <associationName>"`. Lo sostituiamo con `"Volontariato con Bravo! - <title>"` (rimuoviamo il suffisso ETS dal titolo evento — l'associazione resta visibile nei dettagli/descrizione dell'esperienza nel corpo email).

**c) Evento .ics (Outlook/Apple)**
`supabase/functions/booking-ics/index.ts`, riga 51-53 (`SUMMARY`).

Stessa modifica: `SUMMARY:Volontariato con Bravo! - <title>`.

Manteniamo l'escaping `escapeIcsText` per il titolo dell'esperienza.

### 2. Messaggio di conferma cancellazione

`src/pages/MyBookings.tsx`, `handleCancel` (riga 165-168).

Sostituiamo il toast attuale con:
- title: `"Prenotazione cancellata"`
- description: `"La tua prenotazione è stata cancellata con successo. Se avevi aggiunto l'evento al calendario, ricordati di liberare lo slot."`

Toast normale (non destructive), durata default. Unico punto di cancellazione employee in app.

## Deploy

Vanno ridistribuite due edge function:
- `send-booking-confirmation` (subject del template è bundlato in `send-transactional-email`, quindi va ridistribuita anche quella)
- `booking-ics`

## Cosa NON cambia

- Pipeline email, code pgmq, `email_send_log`, gate `email_settings`.
- RLS, RPC, trigger DB.
- Layout/copy del corpo email — solo subject e SUMMARY calendario.
- Logica di cancellazione (resta `UPDATE bookings SET status='cancelled'`).
