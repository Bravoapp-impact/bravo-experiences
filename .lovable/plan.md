# Refactor tabelle "Attio-style" — sweep finale

## Obiettivo
Tutte le tabelle e liste dell'app devono avere lo stesso look della pagina `/super-admin/associations`:
- nessun wrapper `<Card>` attorno alla tabella
- header tabella con `bg-muted/50`
- righe separate da `border-b border-border` (hairline)
- contenitore = `PageSection` (flat su page background)

## Risposta alla domanda "ha senso modificare un componente tabella?"
**Sì, in parte — ma non serve creare un nuovo componente.** Il "look" è già governato da tre primitive condivise che oggi sono già allineate:

- `src/components/ui/table.tsx` → `TableRow` ha già `border-b` di default ✓
- `src/components/crud/CrudTableCard.tsx` → già refactored, **non** wrappa più in `<Card>`, ha già header con hairline ✓
- `src/components/crud/CrudTableRow.tsx` → già `border-b` ✓

Quindi la "vera" modifica al componente tabella **è già stata fatta** nello scorso giro. Ciò che resta è **bonificare i call-site** che ancora avvolgono manualmente la tabella in `<Card>` invece di usare `CrudTableCard` o `PageSection`.

L'unica piccola aggiunta utile a livello di sistema è una convenzione esplicita nel `Table`:
- aggiungere classe header standard `bg-muted/50` come default opzionale via prop `variant="flat"` su `TableHeader`, **oppure** (più semplice e meno invasivo) lasciare `Table` invariato e applicare `bg-muted/50` sull'unico `TableRow` dell'header — è già il pattern di `AssociationsPage` e di `CrudTableCard`. Scelgo la seconda via per non toccare le primitive shadcn.

## Cosa cambia (call-site da bonificare)

Tabelle/liste che ancora usano `<Card><CardHeader/><CardContent><Table/></CardContent></Card>`:

1. `src/components/hr/BookingsTable.tsx` → rimuovere Card, usare `PageSection` (titolo "Prenotazioni recenti")
2. `src/components/hr/TopPerformersTable.tsx` → rimuovere Card, usare `PageSection` con titolo "Top Performers"
3. `src/components/hr/UpcomingEvents.tsx` → rimuovere Card wrapper attorno alla lista
4. `src/pages/Impact.tsx` → tabelle/liste in card → `PageSection`
5. `src/pages/Profile.tsx` (sezione bookings se presente) → `PageSection`
6. `src/pages/super-admin/TBRequestsPage.tsx` → liste dentro Card → `PageSection` o `CrudTableCard`
7. `src/pages/super-admin/AccessCodesPage.tsx` → idem
8. `src/pages/super-admin/EmailSettingsPage.tsx` → tabelle log → `PageSection`
9. `src/pages/super-admin/ExperiencesPage.tsx` → eventuali tabelle ancora wrappate → `PageSection`
10. `src/pages/super-admin/TBFormatsPage.tsx` → idem
11. `src/pages/association/AssociationHistoryPage.tsx` → tabella storico → `PageSection`

Per ognuno: **nessuna modifica funzionale**, solo rimozione del wrapper `Card/CardHeader/CardContent` e sostituzione con `PageSection` (titolo + opzionale description). Header tabella allineato a `bg-muted/50`. Tutto il resto (logica, fetch, query, RLS, props) resta invariato.

## Cosa NON cambia
- `MetricCard`, `EmployeeMetricsCards`, `SDGImpactGrid`, `HRExperienceCard`, `BookingCard`, sidebar prenotazione su detail page, empty states "hero", grid items → restano `<Card>` (devono spiccare, regola già codificata in `mem://style/card-vs-flat-section`).
- Primitive `src/components/ui/table.tsx` e `src/components/ui/card.tsx` → invariate.
- Modali di dettaglio (BookingDetailModal, FeedbackModal, ecc.) → fuori scope di questo giro (saranno il prossimo sweep).
- Logica, query, RLS, RPC, edge function → zero modifiche.

## Approccio operativo
Un solo passaggio, file per file, in ordine:
1. HR (`BookingsTable`, `TopPerformersTable`, `UpcomingEvents`) — visibile in HR Home
2. Super Admin (`TBRequestsPage`, `AccessCodesPage`, `EmailSettingsPage`, `ExperiencesPage`, `TBFormatsPage`)
3. Cross-role (`Impact`, `Profile`, `AssociationHistoryPage`)

Verifica visiva al termine confrontando con `/super-admin/associations`.

## Aggiornamenti documentazione
- `docs/log.md`: entry "Sweep Card→PageSection per tabelle/liste"
- `docs/aperto.md`: rimuovere voce "follow-up sweep tabelle"; aggiungere "modali da bonificare" come prossimo step
- `docs/design-system.md`: aggiungere nota "header tabella sempre `bg-muted/50`" nella sezione Card vs sezione piatta
