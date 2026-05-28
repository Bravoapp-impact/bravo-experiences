# Riconoscere anche l'errore Supabase "User already registered"

## Problema
Dopo l'ultima modifica, l'utente vede un toast di errore generico invece del toast dedicato "Email già registrata" con il link a recupero password. Causa probabile: in alcune configurazioni Supabase restituisce direttamente un errore (`AuthApiError: User already registered`, status 422, code `user_already_exists`) invece di una response con `identities: []`. In quel caso `signUp` lancia subito sull'`if (error) throw error;` e il nostro check su `identities` non viene mai raggiunto; nel `catch` di `Register.tsx` il messaggio non corrisponde al marker `EMAIL_ALREADY_REGISTERED` e finisce nel ramo generico.

## Modifiche

**`src/lib/auth.ts` — funzione `signUp`** (entrambi i path)
- Sostituire il `throw error;` diretto con un controllo: se l'errore è del tipo "user already exists" (riconoscibile da `error.code === "user_already_exists"`, oppure `status === 422` con messaggio che matcha `/already.*registered/i` o `/already.*exists/i`), lanciare `new Error("EMAIL_ALREADY_REGISTERED")`. Altrimenti rilanciare l'errore originale.
- Mantenere anche il check su `data.user.identities?.length === 0` come fallback per la configurazione opposta.

**`src/pages/Register.tsx`**
- Nessuna modifica necessaria: il `catch` già riconosce `EMAIL_ALREADY_REGISTERED` e mostra il toast con `ToastAction` verso `/forgot-password`.
- Per robustezza aggiungere al riconoscimento anche un pattern fallback su `rawMessage` (`/already.*registered/i`) nel caso `signUp` non venisse normalizzato.

## Note tecniche
- Nessun cambiamento a DB, RLS o edge functions.
- Nessun cambiamento ai flussi di successo.
