
## Obiettivo

Permettere all'utente di **cambiare la propria password** dalla sezione profilo, con un **valutatore di forza visivo** e una **checklist di requisiti minimi** che si spuntano in tempo reale. Le stesse regole vengono applicate anche in registrazione e reset password (oggi controllano solo "≥6 caratteri").

## Stato attuale

- **Profilo (tutti i ruoli)**: c'è MFA, ma **non c'è alcun modo per cambiare la password** dall'app. L'unica strada oggi è "password dimenticata".
- **Registrazione e Reset**: controllo minimo a 6 caratteri, nessuna policy.
- 4 pagine profilo gemelle (`Profile.tsx`, `HRProfile.tsx`, `SuperAdminProfile.tsx`, `AssociationAdminProfile.tsx`) — vanno trattate tutte allo stesso modo.

## Cosa costruire

### 1. Regole di password (centralizzate)

Nuovo file `src/lib/password-policy.ts` con:

- Lista requisiti: **≥8 caratteri, una maiuscola, una minuscola, un numero, un carattere speciale**.
- Funzione `evaluatePassword(pwd)` che ritorna: array di requisiti con `met: boolean`, `score` 0–4, `label` ("Debole", "Discreta", "Buona", "Ottima"), `isValid` (true se tutti i requisiti sono soddisfatti).
- Lo score considera: numero requisiti soddisfatti + bonus lunghezza (≥12 char).

Niente librerie esterne (zxcvbn pesa ~400KB). Logica regex semplice, sufficiente per il caso d'uso.

### 2. Componente riusabile `PasswordStrengthInput`

`src/components/auth/PasswordStrengthInput.tsx`:

- Wrappa un `<Input type="password">` con toggle mostra/nascondi (icona occhio, come già in Register/ResetPassword).
- Sotto l'input: barra di forza a 4 segmenti colorata (rosso → arancione → giallo → verde) + label testuale.
- Sotto la barra: checklist requisiti con icona ✓ verde quando soddisfatto, ○ grigia quando no.
- Props: `value`, `onChange`, `id`, `label`, `placeholder`, `showRequirements?` (default true), `showStrengthBar?` (default true).
- Usato in: nuova sezione cambio password del profilo, Register, ResetPassword.

### 3. Sezione "Cambia password" nel profilo

Nuovo componente `src/components/profile/ChangePasswordCard.tsx`:

- Card con titolo "Cambia password" + descrizione breve.
- 3 campi: **Password attuale**, **Nuova password** (con `PasswordStrengthInput`), **Conferma nuova password**.
- Pulsante "Aggiorna password" disabilitato finché: nuova password valida (tutti i requisiti) + conferma combacia + password attuale compilata.
- Logica: ri-autentica con `signInWithPassword(email, currentPassword)` per verificare la vecchia password, poi `supabase.auth.updateUser({ password })`. Toast successo/errore. Reset campi al successo.
- Aggiunto come motion.div in tutte e 4 le pagine profilo, **subito prima** della sezione MFA.

### 4. Aggiornare Register e ResetPassword

- Sostituire l'input password attuale con `PasswordStrengthInput` (mostra strength bar + checklist).
- Bloccare submit se la password non rispetta tutti i requisiti (toast con messaggio chiaro). Rimosso il check fragile "≥6 caratteri".
- In `Register.tsx` e `ResetPassword.tsx` la conferma password rimane com'è (semplice input).

## File interessati

**Nuovi:**
- `src/lib/password-policy.ts`
- `src/components/auth/PasswordStrengthInput.tsx`
- `src/components/profile/ChangePasswordCard.tsx`

**Modificati:**
- `src/pages/Profile.tsx`, `src/pages/hr/HRProfile.tsx`, `src/pages/super-admin/SuperAdminProfile.tsx`, `src/pages/association/AssociationAdminProfile.tsx` — aggiungono `<ChangePasswordCard />` prima di `<EnrollMFA />`
- `src/pages/Register.tsx`, `src/pages/ResetPassword.tsx` — usano il nuovo input + validazione policy

## Note tecniche

- Nessuna modifica a DB, RLS, edge function: tutto lato client + auth Supabase.
- Coerente con la security memory (validazione lato client; il lato server è già coperto dal flusso `auth.updateUser`).
- Su mobile il componente resta full-width; checklist a 2 colonne su `sm:` per non rubare spazio verticale.
- Per la Leaked Password Protection (HIBP) di Supabase: rimando con una nota separata — è una flag da attivare in Cloud → Auth Settings, non richiede codice. Se vuoi posso attivarla in un secondo step.
