

# Piano: Rinomina "Dipendenti" → "Utenti"

## Sidebar
In `HRLayout.tsx`, cambiare la label da `"Dipendenti"` a `"Utenti"`.

## Path
Si può cambiare tranquillamente il path da `/hr/employees` a `/hr/users` — basta aggiornare:
- `HRLayout.tsx` (href nella sidebar)
- `App.tsx` (route definition)
- `HRHomePage.tsx` (link "Gestisci dipendenti" → "Gestisci utenti" + navigate path)

Il file `HREmployeesPage.tsx` resta con lo stesso nome (è interno, non user-facing).

## Testi nella pagina `HREmployeesPage.tsx`
- PageHeader title: "Dipendenti" → "Utenti"
- Descrizioni e messaggi vuoti: aggiornare "dipendenti" → "utenti" dove appropriato
- Loading message, error message, CSV filename

## File coinvolti

| File | Modifica |
|------|----------|
| `src/components/layout/HRLayout.tsx` | Label + href |
| `src/App.tsx` | Route path |
| `src/pages/hr/HRHomePage.tsx` | Testo bottone + navigate path + label widget |
| `src/pages/hr/HREmployeesPage.tsx` | Titoli e messaggi UI |

4 file, modifiche minimali.

