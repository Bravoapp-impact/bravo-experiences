## Cosa cambia

Aggiungere la colonna `short_description TEXT` alla tabella `public.experiences`. Entrambi i form (ETS e super-admin) già la inviano nel payload, ma la colonna non esiste a DB → Supabase rifiuta l'insert/update con "Could not find the 'short_description' column".

## Perché

Negli Step 2 e 3 del refactor abbiamo introdotto `short_description` nello schema Zod unificato e nei payload dei due wrapper, ma abbiamo dimenticato la migration corrispondente (era già annotata come debito in `docs/aperto.md`). Questo prompt chiude il debito.

## Cosa NON deve cambiare

- Nessuna modifica a RLS, policy, trigger o altre colonne di `experiences`.
- Nessuna modifica al frontend: il codice già legge/scrive `short_description`.
- Nessuna modifica a `max_participants` (debito separato, da chiudere dopo).

## Passi

1. Migration: `ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS short_description TEXT;` (nullable, nessun default — coerente con campo opzionale a max 150 char lato Zod).
2. Aggiornare `docs/log.md` con entry datata 2026-05-20 ("aggiunta colonna `experiences.short_description` per chiudere Step 2/3 del refactor form").
3. Aggiornare `docs/aperto.md` rimuovendo la voce di debito su `short_description` (lasciando intatto il debito su `max_participants`).

## Verifica

Dopo la migration, riprovare il salvataggio dal dialog super-admin: l'errore "Could not find the 'short_description' column" deve sparire. Verificare anche dal form ETS che il valore venga persistito (rileggendo l'esperienza modificata).
