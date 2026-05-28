## Problema
La funzione `getGreeting` in `src/components/layout/AdminLayout.tsx` controlla i valori legacy `"male"` / `"female"` per il campo `gender`, ma il database e il resto dell'app usano `"m"` / `"f"` / `"x"`. Di conseguenza il saluto nella sidebar admin resta sempre `"Bravə"` indipendentemente dal genere scelto dall'utente.

## Soluzione
Aggiornare `getGreeting` in `AdminLayout.tsx` per allinearsi ai valori attuali del database:
- `"m"` → `"Bravo"`
- `"f"` → `"Brava"`
- `"x"` (o qualsiasi altro) → `"Bravə"`

## File coinvolto
- `src/components/layout/AdminLayout.tsx` — riga 61-65

## Verifica
Dopo la modifica, il saluto nella sidebar admin deve cambiare dinamicamente in base al valore `gender` salvato nel profilo.