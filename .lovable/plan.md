# Feedback registrazione con email già esistente

## Obiettivo
Quando un utente tenta di registrarsi con un'email già presente, mostrare un messaggio di errore chiaro invece della schermata "Controlla la tua email".

## Modifiche

**`src/lib/auth.ts` — funzione `signUp`**
- Dopo `supabase.auth.signUp(...)` (in entrambi i path: domain-based e access-code), controllare `data.user?.identities?.length === 0`.
- Se vero, lanciare un errore tipizzato con un marker riconoscibile, es. `const err = new Error("EMAIL_ALREADY_REGISTERED"); throw err;` (oppure aggiungere una proprietà `code`).
- Nel path access-code, fare il check **prima** di chiamare `incrementAccessCodeUsage`, così non si consuma il codice.

**`src/pages/Register.tsx` — `handleSubmit`**
- Nel `catch`, riconoscere il marker `EMAIL_ALREADY_REGISTERED` prima degli altri pattern.
- Mostrare un toast `destructive` con:
  - Titolo: "Email già registrata"
  - Descrizione: "Questa email è già associata a un account. Accedi oppure recupera la password se non la ricordi."
  - `action`: un `ToastAction` con label "Recupera password" che naviga a `/forgot-password` (usare `useNavigate` da `react-router-dom`).
- NON impostare `setRegistrationComplete(true)` in questo caso (garantito dal fatto che `signUp` ora lancia).

## Note tecniche
- Il segnale ufficiale Supabase per "email già esistente" con conferma email attiva è `data.user.identities` come array vuoto: nessun errore viene restituito per evitare user enumeration, ma a livello di UX prodotto vogliamo essere espliciti (scelta consapevole del prodotto).
- Nessuna modifica a DB, edge functions o RLS.
- Nessun cambiamento al flusso di successo né al messaggio "Controlla la tua email".
