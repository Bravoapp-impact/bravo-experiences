## Obiettivo
Quando un dipendente conferma una prenotazione di volontariato, inviare in parallelo alla conferma esistente una notifica email al suo responsabile (se `profiles.manager_email` è valorizzato), senza bloccare né far fallire la prenotazione.

## Cosa cambia

### 1. Nuovo template React Email
`supabase/functions/_shared/transactional-email-templates/manager-new-booking.tsx`

Stesso stile sobrio di `manager-absence-notification.tsx`. Mostra:
- nome e cognome del collaboratore
- data evento (long format)
- orario inizio / fine
- nome azienda

NON mostra: titolo esperienza, ente, città, indirizzo.

Subject simile a: `"<Nome Cognome> parteciperà a un'attività di volontariato"`.

### 2. Registro template
`supabase/functions/_shared/transactional-email-templates/registry.ts`
Aggiungere import + voce `'manager-new-booking'` nella mappa `TEMPLATES`.

### 3. Nuova wrapper edge function
`supabase/functions/send-manager-new-booking/index.ts`

Pattern identico a `send-booking-confirmation`:
- input: `{ booking_id }`
- auth: Bearer token + `auth.getUser()`
- authorization: owner del booking OR `super_admin`/`hr_admin`
- carica `bookings` → `profiles` (email manager, first_name, last_name, company_id) → `experience_dates` (start/end) → `companies` (name)
- **early return success** se `profile.manager_email` è null/vuoto (non è un errore)
- **anti-duplicazione**: prima di inviare, check su `email_logs` `WHERE booking_id = ? AND email_type = 'manager_new_booking' AND status = 'sent'`; se esiste già, return success
- **idempotency key**: `manager-new-booking-<booking_id>`
- invoca `send-transactional-email` con `templateName: 'manager-new-booking'`, `recipientEmail: profile.manager_email`, `templateData` minimale (firstName, lastName, eventDateLong, startTime, endTime, companyName)
- log su `email_logs` (`email_type: 'manager_new_booking'`, status sent/failed)

Nota: la suppression list pre-check è applicata automaticamente da `send-transactional-email` (come per le altre wrapper esistenti, che non la duplicano).

### 4. Config edge function
`supabase/config.toml`: aggiungere blocco `[functions.send-manager-new-booking]` con `verify_jwt = false` (coerente con le altre wrapper).

### 5. Trigger lato client
`src/pages/ExperienceDetail.tsx` (intorno a riga 288-292): subito dopo la `invoke("send-booking-confirmation", ...)` esistente, aggiungere una seconda `invoke("send-manager-new-booking", { body: { booking_id: bookingData.id } })`, anch'essa **fire-and-forget** (no await), in parallelo. Nessun try/catch che possa propagare errori alla UI.

## Note tecniche

- Nessuna migration DB: `email_logs` accetta già `email_type` arbitrario e `profiles.manager_email` esiste già.
- Nessuna nuova GRANT/RLS necessaria.
- Il gate company-level `email_settings.confirmation_enabled` NON si applica qui: è una notifica nuova, distinta dalla conferma al dipendente. Se in futuro servirà un opt-out dedicato, sarà un'aggiunta separata.
- L'edge function viene deployata automaticamente.
