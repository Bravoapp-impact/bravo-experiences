## Obiettivo

Aggiungere al form di registrazione una scelta obbligatoria su come l'utente vuole essere accolto ("Bravo!", "Brava!", "Bravə!"), salvando il valore (`m`, `f`, `x`) nei metadata utente in modo che il trigger `handle_new_user` (che già gestisce `gender`) lo persista su `profiles.gender`.

## Cosa modificare

### 1. `src/pages/Register.tsx`
- Aggiungere `gender: ""` allo state `formData`.
- Aggiungere un blocco di scelta sotto i campi Nome/Cognome (prima di Email), titolato **"Come vuoi che ti accogliamo nell'app?"**, con 3 opzioni affiancate (RadioGroup di shadcn, layout `grid-cols-3 gap-2`):
  - "Bravo!" → valore `m`
  - "Brava!" → valore `f`
  - "Bravə!" → valore `x`, con micro-helper text sotto: *"Forma neutra"* (`text-xs text-muted-foreground`).
- Nessuna opzione preselezionata (`value=""`).
- Validazione in `handleSubmit`: se `gender` vuoto → toast errore *"Seleziona come vuoi essere accolto"* e blocco submit.
- Passare `gender` a `signUp({ ..., gender })`.

Stile: leggero e coerente — niente card, label `text-sm font-medium` come gli altri campi, radio compatti.

### 2. `src/lib/auth.ts`
- Estendere `SignUpData` con `gender: "m" | "f" | "x"`.
- In `signUp`, includere `gender` in `options.data` (user metadata) in **entrambi** i percorsi:
  - Path dominio email (no access code).
  - Path con access code (dentro `userMetadata`).

### 3. Trigger DB
Nessuna modifica: `handle_new_user` già legge `raw_user_meta_data->>'gender'` e lo scrive su `profiles.gender`. La colonna `profiles.gender` esiste già.

## Fuori scopo
- Non tocchiamo le copy di accoglienza nel resto dell'app (verranno adattate quando si userà il campo).
- Nessuna modifica a flussi di login/access-request.
