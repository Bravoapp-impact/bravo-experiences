# Diagnosi: perché l'email al responsabile non parte

## Come dovrebbe funzionare

1. La funzione SQL `send-manager-absence-notifications-daily` gira ogni giorno alle **08:00 UTC** via `pg_cron`.
2. Fa una `net.http_post` verso l'edge function `send-manager-absence-notifications`, autenticandosi con un secret nel vault chiamato `email_queue_service_role_key`.
3. L'edge function scansiona le `bookings` confirmed nei prossimi 30 giorni; per ogni utente con `manager_email` valorizzata, verifica se l'evento cade **esattamente nella finestra `[oggi + advance_days, oggi + advance_days + 1)**` (per Bravo! `advance_days = 7`).
4. Se sì, controlla anti-duplicazione su `email_logs` + suppression list, poi accoda l'email via `send-transactional-email` (template `manager-absence-notification`).

Il tuo test: booking `8aa09e0c…` per il 27/05 14:00 UTC, manager `team@bravoapp.it`, creata il 20/05 alle 07:57 UTC. L'evento è a 7 giorni → finestra centrata sul **20/05 alle 08:00 UTC**, quindi il cron di quel giorno avrebbe dovuto mandarla.

## Cosa sta succedendo davvero

Il cron parte regolarmente ogni giorno (`cron.job_run_details` = `succeeded`), MA tutte le `net.http_post` ritornano **401 "Invalid authentication"** (verificato su `net._http_response`, ultime ~20 chiamate tutte 401). L'edge function non viene mai eseguita: zero log lato edge runtime, zero righe in `email_logs`.

Causa: il secret `email_queue_service_role_key` salvato in `vault.decrypted_secrets` è **disallineato** rispetto all'attuale `SUPABASE_SERVICE_ROLE_KEY` del progetto (tipico dopo una rotazione della chiave). Lo stesso secret è usato da praticamente tutti i cron email — quindi sono giù anche `process-email-queue`, e i due cron nuovi schedulati l'altro giorno (`process-completed-events-hourly`, `send-feedback-request-hourly`) stanno fallendo per lo stesso motivo.

Questo spiega anche perché il test non ha mai prodotto nulla: non è arrivata in spam, proprio non è mai uscita dall'edge function — non è mai stata invocata.

## Fix proposto

Un solo intervento, idempotente e gestito da Lovable Cloud: **rifare il setup dell'infrastruttura email**, che rigenera il vault secret `email_queue_service_role_key` con il service role key corrente e ri-aggancia tutti i cron job. Non tocca template, edge function, tabelle o policy — è la procedura ufficiale di recovery dopo una rotazione.

Dopo il fix, per validare che funzioni davvero senza aspettare il cron delle 08:00 di domani:

1. **Forzo manualmente una run** della funzione SQL `send-manager-absence-notifications` lato edge (o invoco direttamente l'edge function `send-manager-absence-notifications`) e controllo che ritorni 200.
2. Verifico su `net._http_response` che le prossime chiamate cron tornino 200, non più 401.
3. Per testare end-to-end l'invio al responsabile servirebbe un booking con evento esattamente a 7 giorni da oggi. Le opzioni:
  - **(a)** Crei tu un nuovo booking su un'esperienza che cade il 30/05 (= oggi + 7), con manager_email impostata, e aspetti il cron delle 08:00 UTC di domani.
  - **(b)** Per testare subito senza aspettare, posso temporaneamente abbassare `manager_notification_advance_days` di Bravo! da 7 a 4, far girare la funzione a mano (il tuo booking del 27/05 cadrà nella finestra `[oggi+4, oggi+5)`), e poi riportarla a 7.

## Cosa NON cambio

- Niente modifiche all'edge function `send-manager-absence-notifications` (la logica è corretta).
- Niente modifiche al cron `send-manager-absence-notifications-daily` né agli altri cron schedulati.
- Niente modifiche al template `manager-absence-notification`.

## Domanda per te

Procedo con il fix + opzione **(b)** per validare subito end-to-end (e ti dico l'esito), oppure preferisci opzione **(a)** e aspetti il cron di domani?  
  
Procediamo con l'opzione b