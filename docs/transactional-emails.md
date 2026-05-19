# Email transazionali

_Documento vivo — versione 1.0, 20 aprile 2026_

Questo documento spiega come funziona oggi il sistema di email transazionali di Bravo! e come si aggiunge una nuova email. È il riferimento da consultare ogni volta che un'ondata della roadmap introduce una nuova comunicazione automatica (benvenuto HR, notifiche esperienze, follow-up, ecc.).

## Architettura attuale

Il dominio `updates.bravoapp.it` è verificato su Lovable e gestisce l'invio di tutte le email transazionali. L'infrastruttura sotto (coda pgmq, retry, suppression list, unsubscribe one-click, log su `email_send_log`) è gestita da Lovable tramite l'edge function `send-transactional-email`, che è l'unico punto di uscita reale verso il provider.

Sopra a questo, Bravo! ha **wrapper edge function specifiche per tipo di email** (oggi: `send-booking-confirmation`, `send-booking-reminders`, `send-feedback-request`) che fanno la business logic — query DB per recuperare il contesto, controllo dei gate di invio, anti-duplicazione — e poi delegano l'invio a `send-transactional-email`. I template visivi sono **componenti React Email** in `supabase/functions/_shared/transactional-email-templates/`, registrati nella mappa `TEMPLATES` di `registry.ts`.

L'opt-out funziona su due livelli: un **gate company-level** sulla tabella `email_settings` (l'HR Admin può disattivare conferme o reminder per la propria azienda dalla pagina `/super-admin/email-settings`), e un **gate individuale Lovable native** via `suppressed_emails` (gestito automaticamente da unsubscribe, bounce, complaint). L'anti-duplicazione applicativa usa la tabella `email_logs` insieme a un `idempotencyKey` univoco passato a `send-transactional-email`.

## Come si aggiunge una nuova email

### a. Crea il template React Email

Crea `supabase/functions/_shared/transactional-email-templates/<nome-kebab>.tsx` seguendo il pattern dei template esistenti (`booking-confirmation.tsx` è il più completo, `feedback-request.tsx` è il più snello). Il file deve esportare una variabile `template` con `component`, `subject` (stringa o funzione), `displayName`, `previewData`. Usa solo componenti React Email e stili inline; il logo Bravo! sta nel bucket `email-assets` come `bravo-logo-icon.png`. Non aggiungere link di unsubscribe — li inietta Lovable in automatico.

### b. Registra il template

Apri `supabase/functions/_shared/transactional-email-templates/registry.ts`, aggiungi un `import { template as <alias> } from './<nome-kebab>.tsx'` e una voce nella mappa `TEMPLATES` con la chiave kebab-case che userai come `templateName`.

### c. Crea la wrapper edge function

Crea `supabase/functions/send-<nome>/index.ts` partendo da `send-booking-confirmation/index.ts`, che è il pattern di riferimento più semplice. La wrapper deve:

- autenticare il chiamante (Bearer token, `auth.getUser()`);
- autorizzare l'azione (es. il chiamante è l'owner del booking, o un `super_admin`/`hr_admin`);
- caricare il contesto dal DB (profilo utente, esperienza, data, eventuali aggregati);
- applicare i **gate di invio**: il check su `email_settings` se l'email è soggetta all'opt-out company-level, e il check su `email_logs` se serve evitare duplicati;
- comporre `templateData` con i soli campi che il template effettivamente usa (niente HTML, niente testi liberi qui);
- invocare `supabase.functions.invoke('send-transactional-email', { body: { templateName, recipientEmail, idempotencyKey, templateData } })`;
- registrare l'esito su `email_logs` (`status: 'sent'` o `'failed'`).

L'`idempotencyKey` deve essere derivato dall'evento univoco che ha triggerato l'email + nome template (es. `booking-confirm-<booking_id>`, `feedback-request-<booking_id>`). Niente timestamp né random — la chiave esiste proprio per garantire che retry o doppi click non producano doppi invii.

### d. Triggera la wrapper dal posto giusto

- **Client-side** (caso più comune): l'email è la conseguenza di un'azione utente. Dopo la mutation che genera l'evento (es. insert su `bookings`), chiama `supabase.functions.invoke('send-<nome>', { body: { ... } })` dal componente. Pattern attuale di `send-booking-confirmation`.
- **Cron Supabase**: solo se l'email è batch e schedulata (es. reminder 24h prima). Pattern attuale di `send-booking-reminders`, gestito da `pg_cron` lato DB. Vai per cron solo se non c'è un evento utente puntuale a cui agganciarsi.
- **Database trigger**: solo se strettamente necessario e dopo aver scartato le altre due opzioni. I trigger DB sono difficili da osservare e da disattivare in emergenza.

### e. Logga su `email_logs` se serve anti-duplicazione

Se la stessa email non deve mai partire due volte per lo stesso evento (caso tipico: feedback request, reminder), inserisci una riga in `email_logs` con `booking_id` + `email_type` dopo l'invio e controllala in apertura della wrapper prima di procedere. L'`idempotencyKey` di Lovable copre i retry stretti, ma `email_logs` copre lo scenario più ampio "questa email per questo evento è già partita giorni fa".

## Dove NON mettere le cose

- **Niente chiamate Resend.** L'integrazione Resend non esiste più — il segreto `RESEND_API_KEY` è stato rimosso. Tutto passa da `send-transactional-email`.
- **Niente `verify_jwt = true`** sulla wrapper in `supabase/config.toml`. Il pattern per le edge function interne di Bravo! è `verify_jwt = false`: l'autenticazione viene fatta a mano leggendo l'header `Authorization` dentro la function, come fa `send-booking-confirmation`. Mettere `verify_jwt = true` rompe le invocazioni server-to-server tra wrapper e `send-transactional-email`.
- **Niente HTML inline** nella wrapper. Il rendering del corpo email è responsabilità esclusiva del template React Email. La wrapper passa solo dati strutturati via `templateData`.
- **Niente logica di invio duplicata.** Se servono nuovi canali (es. integrazione con un altro provider), si discute prima di scrivere codice. Oggi c'è un solo punto di uscita ed è giusto così.

## Allegati e calendari

`sendLovableEmail` (la library che fa da gateway verso il provider) **non supporta allegati binari** e non è in roadmap. Il payload `EmailSendRequest` accetta solo `html` + `text`, niente `attachments`/`files`. Anche la pipeline a valle (`pgmq`, `process-email-queue`, `email_send_log`) è progettata per JSON puro.

Quando un'email deve "consegnare" un file (es. un `.ics` da aggiungere al calendario, una ricevuta PDF, un export CSV), il pattern è:

1. Generare il file server-side (inline nel body di una edge function, oppure salvarlo su Storage in un bucket dedicato).
2. Esporlo via **edge function pubblica** (`verify_jwt = false`) parametrizzata con un identificatore non-enumerabile (UUID v4 random del record, oppure token dedicato — stesso ragionamento dell'unsubscribe).
3. Linkarlo nell'email come bottone/link normale. La edge function risponde con `Content-Type` corretto e `Content-Disposition: attachment` quando serve scaricare.

Esempio in produzione: `booking-ics` serve il `.ics` della prenotazione conferma. La wrapper `send-booking-confirmation` costruisce sia il deep-link Google Calendar (`https://calendar.google.com/calendar/render?action=TEMPLATE&...`, gratis e copre il caso più frequente con un click), sia l'URL `${SUPABASE_URL}/functions/v1/booking-ics?booking_id=<uuid>` per Outlook/Apple/altri client; entrambi gli URL viaggiano nel template via `templateData`.

Per documenti sensibili (fatture, dati personali estesi) sostituire l'UUID con un token a scadenza salvato in DB e validato dalla function: stessa forma, soglia di sicurezza più alta.


## Nota sulla tabella `email_templates`

La tabella `email_templates` **è stata rimossa** insieme alla pagina `/super-admin/email-templates` durante la migrazione a Lovable native. Permetteva la personalizzazione per-azienda dei testi `intro_text`, `closing_text` e `subject`: nessun cliente la usava attivamente e non era una promessa commerciale, quindi è stata droppata per semplificare l'infrastruttura.

Se in futuro tornerà la richiesta di personalizzare i testi per-azienda, va disegnata come **template variables**: la wrapper carica i testi specifici dal DB e li passa come campi di `templateData`, il template React Email li riceve come props con fallback ai testi di default hardcoded. Non ricreare una tabella generica `email_templates`: il rischio è di ricostruire lo stesso debito tecnico appena rimosso.
