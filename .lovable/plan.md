## Cosa è successo

Il messaggio `email rate limit exceeded` viene da **Supabase Auth (GoTrue)**, non dal provider email. GoTrue applica un limite orario al numero di email che può "processare" (signup, recovery, magic link, conferma email). Quando viene superato, blocca la richiesta prima ancora di passare la mail al nostro hook → Lovable Emails.

Default attuale del progetto: **30 email/ora** (valore standard Supabase). Basta una manciata di tentativi ravvicinati (test interni, retry, reinvii) per saturarlo.

I log auth disponibili via analytics non hanno restituito risultati per ieri (retention breve), quindi non possiamo dire l'esatto trigger, ma il pattern è inequivocabile.

## Costi e limite massimo

- **Lato Supabase**: alzare `rate_limit_email_sent` **non ha costo aggiuntivo**. È una semplice impostazione del servizio Auth, indipendente dal piano.
- **Limite massimo**: Supabase non impone un tetto rigido sul valore (si possono impostare valori molto alti, es. 1000+/h). Il limite reale diventa quello del **provider email** a valle (Lovable Emails), che ha le proprie quote/throughput in base al piano. 300/h è ben dentro qualsiasi soglia ragionevole e non genera costi extra.
- A 300/h continuiamo a essere protetti da abusi/loop, ma non blocchiamo più gli utenti reali.

## Cosa faccio

### 1. Alzo il rate limit auth a 300/h
Aggiorno la config auth Supabase: `rate_limit_email_sent = 300`. Cambio runtime, nessuna migration, nessun deploy.

### 2. Aggiorno il messaggio d'errore in `src/pages/Register.tsx`
Aggiungo il riconoscimento dell'errore "rate limit" (insieme a quelli già gestiti) e mostro:

> "In questo momento stiamo ricevendo troppe richieste. Ti preghiamo di riprovare fra un'ora"

Pattern di match: `/rate.?limit/i` sul messaggio raw restituito da Supabase.

### 3. Log
Non sono recuperabili i log auth di ieri tramite il nostro analytics query (zero righe). Ti segnalo che, se vuoi indagare in futuro, possiamo guardare i log dal pannello Cloud → Logs filtrando `status=429` su path `/signup` o `/otp`. Per ora alziamo la soglia + miglioriamo la UX: se il problema si ripresenta nonostante 300/h vorrà dire che c'è un loop/abuso da investigare seriamente.

## File toccati

- Config auth Supabase (via tool, no file)
- `src/pages/Register.tsx` — branch error handling per rate limit

Confermi e procedo?