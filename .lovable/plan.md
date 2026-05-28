Aggiungere il campo "Come vuoi che ti accogliamo nell'app?" (gender m/f/x) alle pagine di modifica profilo di tutti i ruoli, con le stesse tre opzioni della registrazione (Bravo! / Brava! / Bravə!) e nessun helper sotto Bravə.

## File da modificare

### 1. `src/components/settings/ProfileSettingsContent.tsx`
Usato sia da super-admin che da association.
- Aggiungere stato `gender` inizializzato da `profile?.gender || ""`.
- Includerlo in `hasChanges` (rispetto a `profile?.gender || ""`).
- Nella sezione "Dati personali", sotto Email, aggiungere un blocco con `<Label>Come vuoi che ti accogliamo?</Label>` e un `RadioGroup` `grid-cols-3 gap-2` con tre opzioni Bravo!/Brava!/Bravə! → valori `m`/`f`/`x`. Stile coerente con il resto del form (label `text-xs text-muted-foreground`, controlli compatti).
- In `handleSave` includere `gender: gender || null` nell'`update` su `profiles` (consenti di lasciarlo vuoto in modifica? No — è una preferenza, ma in registrazione era obbligatoria. Per modifica manteniamo coerenza: non permettere di tornare a vuoto, almeno una scelta deve restare. Il radio non avrà opzione "nessuna", quindi se il profilo è già valorizzato non potrà essere svuotato.).

### 2. `src/pages/hr/settings/SettingsProfile.tsx`
Stessa identica modifica del punto 1 (file paralleli, stessa struttura).

### 3. `src/pages/settings/EmployeeSettingsPersonali.tsx`
Pattern diverso (lista di `SettingsField` espandibili).
- Aggiungere un nuovo `SettingsField label="Come ti accogliamo"` con `value` derivato dal `profile.gender` (mappa `m`→"Bravo!", `f`→"Brava!", `x`→"Bravə!", vuoto → placeholder).
- Il render-prop apre un piccolo form `GenderForm` con `RadioGroup` (3 opzioni, stesso stile di registrazione), bottone Salva che fa `update({ gender })` su `profiles`, `refreshProfile()` e `onSaved()`.

## Note tecniche

- Il campo `gender` esiste già su `profiles` (vedi `handle_new_user` trigger) — nessuna migrazione DB necessaria.
- Il tipo `Profile` in `useAuth` dovrebbe già esporre `gender`; se non lo fa, leggerlo via select esplicita o ampliare il tipo locale. Verificare a build-time.
- Nessuna modifica a `auth.ts` o al form di registrazione.

## Fuori scope

- Nessun cambio a copy/comunicazioni che usano il gender (gestiti altrove).
- Nessuna validazione "non puoi svuotare": basta il fatto che il RadioGroup non ha opzione null.