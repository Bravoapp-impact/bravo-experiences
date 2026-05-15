## Cosa cambia

1. **Allineamento verticale** tra l'header del contenuto pagina e il blocco "profilo" in cima alla sidebar (stile Attio).
2. **Icona accanto al titolo** della pagina, presa dalla stessa voce attiva della sidebar (stesso colore/icona).
3. Vale per **tutte le pagine admin** (Super Admin, HR, Association). Le pagine senza titolo erediteranno solo l'allineamento (stesso `padding-top`).

## Cosa NON cambia

- Logica, query, RLS, edge function.
- Sidebar (struttura, voci, colori, dropdown).
- Card, tabelle, `PageSection`, `CrudTableCard` e tutti i contenuti sotto l'header.
- Layout pubblico/employee (`AppLayout`) — solo gli `AdminLayout`-based.

## Come

### 1. AdminLayout — allinea il `<main>` alla baseline della sidebar

Il blocco profilo in sidebar è dentro `px-3 pt-3 pb-2` con un bottone `py-2 px-2` + avatar `h-7`. Il `<main>` oggi usa `p-4 sm:p-6 lg:p-8` → il titolo cade ~20px più in basso del profilo.

Cambio in `src/components/layout/AdminLayout.tsx`:
- `<main>` da `p-4 sm:p-6 lg:p-8` → `px-4 sm:px-6 lg:px-8 pt-3 pb-8` (top = `pt-3`, identico alla sidebar). Il padding interno dell'header verticale viene gestito dal nuovo `PageHeader` (vedi punto 2), così il titolo è perfettamente in linea col nome utente.

### 2. PageHeader — nuova prop `icon` + altezza coerente con la riga profilo

In `src/components/common/PageHeader.tsx`:
- Aggiungo prop opzionale `icon?: LucideIcon` e `iconColor?: string`.
- Il render diventa una riga con `min-h-[44px]` (= avatar `h-7` + `py-2` della sidebar), `items-center`. L'icona, se presente, è in un quadrato `h-7 w-7` con `bg-muted` + l'icona colorata (stesso pattern usato nel dropdown della sidebar), allineato a sinistra del titolo.
- Layout: `<icon-box> <titolo + descrizione>` a sinistra, `actions` a destra. Su mobile il blocco actions va a capo come oggi.

### 3. Pagine — passano `icon` e `iconColor` corrispondenti alla voce sidebar

Ogni pagina che già usa `<PageHeader>` riceve `icon`/`iconColor` dalla rispettiva voce della propria sidebar (vedi `HRLayout.tsx`, `AssociationLayout.tsx`, `SuperAdminLayout.tsx`). Per evitare duplicazione, esporto da ciascun file di layout una mappa `href → { icon, iconColor }` e fornisco un piccolo helper `useSidebarItemMeta()` (basato su `useLocation`) che le pagine possono usare per ottenere l'icona corretta. La pagina passa il risultato direttamente a `<PageHeader icon={meta.icon} iconColor={meta.iconColor} />`.

Pagine toccate (solo aggiunta delle 2 prop):
- Super Admin: `Dashboard`, `Companies`, `Associations`, `Users`, `Experiences`, `Categories`, `Cities`, `AccessRequests`, `TBRequests`, `TBFormats`, `AccessCodes`, `EmailSettings`.
- HR: `HRDashboard`, `HRExperiencesPage`, `HREmployeesPage`, `HRTeamBuildingPage`, e altre con `PageHeader`.
- Association: `AssociationCalendarPage`, `AssociationHistoryPage`, `AssociationExperiencesPage`, ecc.

### 4. Pagine senza `PageHeader`

Nessuna modifica nei file pagina: ereditano automaticamente il nuovo `pt-3` del `<main>` quindi il loro contenuto inizia in linea col blocco profilo della sidebar.

## Dettagli tecnici

```text
Sidebar header                Main
┌──────────────────────┐     ┌────────────────────────────┐
│ pt-3                 │     │ pt-3                       │
│  ┌──────────────┐    │     │  ┌──┐                      │
│  │ avatar h-7   │ Mario │  │  │■ │  Volontariato azie...│
│  └──────────────┘ Demo │  │  └──┘  Gestisci program... │
└──────────────────────┘     └────────────────────────────┘
   ^ baseline allineate ^
```

Icona pagina: stesso glyph della sidebar, dimensione `h-4 w-4` dentro un riquadro `h-7 w-7 rounded-md bg-muted flex items-center justify-center`, con `iconColor` applicato all'icona (es. `text-green-500` per Volontariato).

## Documentazione

- `docs/design-system.md`: aggiungo sezione "Allineamento header pagina ↔ sidebar" e "Icona titolo".
- `docs/log.md`: entry sintetica.
- `mem://style/component-patterns`: aggiorno con la regola dell'icona accanto al titolo.

## Fuori scope

- Pagine di dettaglio (es. `/super-admin/companies/:id`) che non usano `PageHeader`: restano come sono, ereditano solo l'allineamento.
- `AppLayout` employee (mobile-first): non toccato.
