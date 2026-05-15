
# Fix invio reminder + URL email centralizzato

## Obiettivo
1. Risolvere il bug del cron `send-booking-reminders-hourly` (0% success → 401).
2. Introdurre una env var unica `APP_BASE_URL` per tutti i link nelle email, così cambi futuri di dominio si fanno in un punto solo.

## Modifiche

### 1. `supabase/functions/send-booking-reminders/index.ts`
Allineare il pattern di auth a quello di `send-feedback-request`:
- Se l'`Authorization` header contiene il `SERVICE_ROLE_KEY` → bypass `auth.getUser()` e check `super_admin` (chiamata da cron).
- Altrimenti, mantenere il flusso attuale (`auth.getUser()` + check `super_admin`) per le invocazioni manuali.

### 2. Riscrivere il cron `send-booking-reminders-hourly`
- `cron.unschedule('send-booking-reminders-hourly')`
- Ricreare il job leggendo il service role key dal Vault (`email_queue_service_role_key`, già usato da `process-email-queue`) invece dell'anon key hardcoded.
- Mantenere la cadenza oraria attuale.

### 3. Aggiungere secret runtime `APP_BASE_URL`
Tramite `add_secret`. Valore: `https://experiences.bravoapp.it`.
Usato dalle wrapper edge function come unica fonte di verità per i link in-app.

### 4. Aggiornare le wrapper edge function per leggere `APP_BASE_URL`
- `send-feedback-request/index.ts`: rimuovere l'URL hardcoded, leggere da `Deno.env.get("APP_BASE_URL")` con fallback `https://experiences.bravoapp.it`, passare `feedbackUrl: ${APP_BASE_URL}/app/bookings` in `templateData`.
- `send-booking-confirmation/index.ts`: se in futuro servirà passare un link app, già pronto. Per ora aggiungere solo la lettura dell'env var (no-op sui template attuali che non hanno link in-app).
- `send-booking-reminders/index.ts`: idem (no-op: il template reminder non ha link in-app oggi).

I template (`feedback-request.tsx`) mantengono il default hardcoded come fallback per la preview dashboard — nessuna modifica al rendering visivo.

### 5. Deploy
Deployare le 3 wrapper modificate:
`send-feedback-request`, `send-booking-reminders`, `send-booking-confirmation`.

## Cosa NON tocco
- Template React Email (visual invariato).
- `email_logs` / idempotency.
- `process-email-queue` e infrastruttura coda.
- `auth-email-hook` (già aggiornato in turno precedente).

## Verifica
- Trigger manuale di `send-booking-reminders-hourly` via SQL o attesa del prossimo run, controllo log edge function (atteso: 200, non più 401).
- Trigger di `send-feedback-request` di test, verifica che il link nell'email punti a `https://experiences.bravoapp.it/app/bookings` letto dall'env var.
