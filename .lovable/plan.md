## Obiettivo

Applicare a tutte le tabelle dell'app lo stesso layout di `/super-admin/associations`:
- contenitore con bordo arrotondato (`rounded-lg border border-border`)
- header su sfondo `bg-muted/50`
- righe separate da hairline (già attivo su `TableRow`)

## Approccio

Invece di duplicare il wrapper `<div className="rounded-lg border border-border overflow-hidden">` su ogni pagina, lo **centralizzo nel componente base `src/components/ui/table.tsx`**, così ogni nuova tabella eredita lo stile e non possiamo più dimenticarcelo.

### Modifiche al componente base

1. **`src/components/ui/table.tsx`**
   - `Table`: il wrapper diventa `rounded-lg border border-border overflow-hidden` (oltre a `overflow-auto` interno).
   - `TableHeader`: aggiungo `bg-muted/50` di default sull'header (ed elimino la necessità di metterlo a mano sul `TableRow` interno).
   - `TableHead`: tipografia invariata.
   - Aggiungo prop opzionale `unstyled` su `Table` per i (rari) casi in cui serva una tabella senza bordo (es. tabelle annidate); default `false`.

### Pulizia call-site

Rimuovo i wrapper duplicati ora ridondanti su:
- `src/pages/super-admin/AssociationsPage.tsx`
- `src/pages/super-admin/CompaniesPage.tsx`
- `src/pages/super-admin/CategoriesPage.tsx`
- `src/pages/super-admin/CitiesPage.tsx`
- `src/pages/super-admin/AccessCodesPage.tsx`
- `src/pages/super-admin/ExperiencesPage.tsx`
- `src/pages/super-admin/TBFormatsPage.tsx`
- `src/components/hr/BookingsTable.tsx`

E rimuovo il `bg-muted/50` esplicito sui `TableRow` dell'header dove era stato messo a mano (ora è di default).

### Tabelle che NON avevano il bordo — diventano bordate "gratis"

- `src/pages/super-admin/UsersPage.tsx`
- `src/pages/super-admin/TBRequestsPage.tsx`
- `src/pages/super-admin/AccessRequestsPage.tsx` (sostituisco anche il `rounded-lg border bg-card` con il default)
- `src/pages/hr/HREmployeesPage.tsx`
- `src/pages/hr/settings/SettingsMembers.tsx`
- `src/components/hr/TopPerformersTable.tsx`

## Cosa NON tocco

- Logica, query, RLS, edge functions.
- `<Card>` esistenti che devono spiccare (metric cards, sidebar dettaglio esperienza, grid item cards).
- Componenti che usano `rounded-lg border` per box che NON sono `<Table>` (es. `EmailSettingsPage` riga indirizzo, `HRExperienceCard` slot date) — restano invariati.
- `CrudTableCard`, `CrudTableRow`, `PageSection`: nessuna modifica, già coerenti.

## QA

- Verifica visiva su `/super-admin/associations` (deve restare identica), `/super-admin/users`, `/hr/users`, `/hr` (BookingsTable, TopPerformers).
- Aggiorno `docs/design-system.md` e `docs/log.md` con la nota: "Lo stile bordato è ora il default del componente `Table`".
- Aggiorno la memory `mem://style/card-vs-flat-section` per riflettere questa centralizzazione.
