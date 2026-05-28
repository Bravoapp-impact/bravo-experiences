## Obiettivo

Inviare al dipendente un reminder email 17 giorni prima dell'esperienza per ricordargli che ha tempo fino a 14 giorni prima per annullare la prenotazione online. Job batch giornaliero sullo stesso pattern di `send-manager-absence-notifications`.

## Cosa cambia

### 1. Nuovo template React Email

`supabase/functions/_shared/transactional-email-templates/cancellation-deadline-reminder.tsx`

Stile sobrio coerente con gli altri template Bravo!. Props:

- `firstName`
- `eventDateLong` (data esperienza)
- `cancellationDeadlineLong` (data esperienza − 14 giorni, formato esteso it-IT)
- `bookingsUrl` (sempre `https://experiences.bravoapp.it/app/bookings`)

Contenuto: ricorda che hai ancora 3 giorni per annullare la tua prenotazione per questa esperienza: [nome esperienza]; Trascorsi questi 3 giorni, il posto si considera confermato in via definitiva. CTA "Vai alle mie prenotazioni" → `bookingsUrl`.

Subject: `"Ultimi giorni per annullare la tua prenotazione"`.

### 2. Registro template

Aggiungere import + voce `'cancellation-deadline-reminder'` in `supabase/functions/_shared/transactional-email-templates/registry.ts`.

### 3. Nuova wrapper edge function batch

`supabase/functions/send-cancellation-deadline-reminders/index.ts`

Pattern identico a `send-manager-absence-notifications`:

- Auth: service role (cron) OR super_admin user JWT.
- Finestra: bookings con `experience_dates.start_datetime` nel giorno UTC `[oggi+17, oggi+18)` (helper `isInDayWindow(date, 17)` analogo a `isInAdvanceWindow`).
- Query: `bookings` con `status = 'confirmed'` joinato a `experience_dates!inner` filtrato sulla finestra. Lo `status = confirmed` garantisce che le prenotazioni cancellate nel frattempo non ricevano la mail.
- Per ogni booking:
  - carica `profiles` (email, first_name) — skip se profilo o email mancante
  - anti-duplicazione: skip se esiste già log su `email_logs` con `email_type = 'cancellation_deadline_reminder'` per questo booking
  - pre-check suppression list su `recipient_email.toLowerCase()` (skip se presente)
  - calcola `cancellationDeadlineLong` = `start_datetime − 14 giorni`
  - invoca `send-transactional-email` con:
    - `templateName: 'cancellation-deadline-reminder'`
    - `recipientEmail: profile.email`
    - `idempotencyKey: cancellation-deadline-${booking.id}`
    - `templateData: { firstName, eventDateLong, cancellationDeadlineLong, bookingsUrl }`
  - log su `email_logs` (`status: 'sent'` o `'failed'`)
- Risposta JSON con contatori `emails_sent` / `emails_skipped`.

### 4. Config edge function

`supabase/config.toml`: aggiungere blocco

```
[functions.send-cancellation-deadline-reminders]
  verify_jwt = false
```

### 5. Cron schedule giornaliero

Usare lo strumento `supabase--insert` (NON migration, perché contiene URL + anon key project-specific) per registrare un job `pg_cron` che invoca la funzione una volta al giorno alle 08:00 UTC (stesso slot tipico del job manager-absence):

```sql
select cron.schedule(
  'send-cancellation-deadline-reminders-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://cyazgtnjtnyxscfzsasp.supabase.co/functions/v1/send-cancellation-deadline-reminders',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>"}'::jsonb,
    body := concat('{"trigger":"cron","time":"', now(), '"}')::jsonb
  );
  $$
);
```

(verifico prima che `pg_cron` e `pg_net` siano già abilitati — lo sono, dato che il job manager-absence è già schedulato.)

## Note tecniche

- Nessuna migration DB necessaria: `email_logs` accetta `email_type` arbitrario, `suppressed_emails` esiste già.
- Nessuna nuova RLS/GRANT.
- L'edge function viene deployata automaticamente.
- La finestra di 24h (giorno UTC pieno) protegge dai ritardi del cron: se il job parte tardi, intercetta comunque le date che cadono in quel giorno.
- Niente trigger client-side: tutto è batch giornaliero.