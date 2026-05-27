## Obiettivo

Semplificare la pagina di registrazione rimuovendo l'intero percorso a codice di accesso dalla UI. La registrazione avviene ora esclusivamente tramite riconoscimento dominio email aziendale (gestito dal trigger lato server).

## File coinvolti

- `src/pages/Register.tsx`

## Modifiche da apportare

### 1. Rimuovere campo "Codice di accesso" dalla UI

- Commentare o rimuovere il blocco JSX che renderizza l'input del codice di accesso (con icona Building2, validazione, messaggio di conferma entityName).
- Rimuovere gli stati correlati dal componente: `entityName`, `isValidatingCode`, e la logica `handleCodeBlur`.

### 2. Rimuovere CTA "Non hai il codice di accesso?"

- Rimuovere il pulsante/link che apre l'`AccessRequestModal`.
- Rimuovere lo stato `accessRequestModalOpen` e il rendering del componente `AccessRequestModal` (o lasciarlo importato ma non renderizzato).

### 3. Adattare il submit

- Rimuovere `accessCode` dal payload passato a `signUp()` — la funzione supporta già la signature senza accessCode.
- Rimuovere la dipendenza `entityName` dalla condizione `disabled` del bottone di submit.

### 4. Gestire errore dominio non riconosciuto

- Nel catch del `handleSubmit`, intercettare l'errore proveniente dal trigger lato server (dominio email non riconosciuto).
- Mostrare un toast con messaggio chiaro: "Questa email non è ammessa alla registrazione. Contatta il team di Bravo! per maggiori informazioni - team@bravoapp.it"

## Cosa NON modificare

- Non rimuovere `AccessRequestModal` come file/componente — solo non renderizzarlo.
- Non modificare `src/lib/auth.ts` (la funzione `signUp` supporta già accessCode opzionale).
- Non modificare le pagine super-admin dei codici di accesso.
- Non rimuovere la logica `validateAccessCode` da `auth.ts`.

## Note tecniche

- Il trigger `handle_new_user` rifiuta le registrazioni da domini non riconosciuti sollevando un'eccezione; Supabase propaga l'errore nella risposta di `signUp`.
- L'interfaccia `SignUpData` in `auth.ts` ha già `accessCode?: string`, quindi nessun cambiamento di tipo necessario.