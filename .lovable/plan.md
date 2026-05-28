## Problema

La tabella `profiles` ha un check constraint `profiles_gender_check` legacy che consente solo i valori `'male' | 'female' | 'other'`. Il nuovo flusso (registrazione + GenderSelector) salva invece `'m' | 'f' | 'x'`, quindi ogni update fallisce con violazione del constraint.

Verificato: nessun profilo ha attualmente un valore di gender impostato (tutti `NULL`), quindi non c'è dato legacy da migrare.

## Fix

Migrazione che sostituisce il constraint:

```sql
ALTER TABLE public.profiles DROP CONSTRAINT profiles_gender_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gender_check
  CHECK (gender IS NULL OR gender IN ('m', 'f', 'x'));
```

Nessuna modifica al codice frontend o al trigger `handle_new_user` (già allineati a `m/f/x`).

## Verifica post-migrazione

- Aggiornare il profilo da Impostazioni → salvataggio ok.
- Registrazione nuova utenza con scelta `Bravə!` → profilo creato con `gender = 'x'`.