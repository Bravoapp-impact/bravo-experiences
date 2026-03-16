

# Piano: Refactoring completo sidebar AdminLayout + Layout specifici

## Modifiche a 4 file, nessun file nuovo, nessuna migrazione DB.

---

## 1. `AdminLayout.tsx` — Riscrittura sostanziale

**Rimuovere:**
- Props: `badgeLabel`, `showCompanyLogo`, `dropdownHeader`
- Imports: `bravoLogo`, `Badge`, `ChevronRight`, `LayoutGrid`
- Intero header sidebar (logo Bravo + badge)
- Intero footer utente (avatar + dropdown in basso)
- Variabili `companyLogo`, `companyName`, `displayBadgeLabel`, `getInitials`

**Aggiungere alle props:**
- `entityLogoUrl?: string`
- `dropdownItems?: { label: string; icon: LucideIcon; href?: string; onClick?: () => void }[]`
- `sectionLabels?: { beforeIndex: number; label: string }[]`
- `separatorAfterIndex?: number[]`
- (mantieni `entityName` già esistente)

**Aggiungere imports:** `Settings`, `ChevronsUpDown` da lucide-react

**Nuovo header sidebar** (sostituisce vecchio header + badge + footer):
- Container `px-3 pt-3 pb-2` come primo elemento della sidebar
- `DropdownMenu` wrapper, trigger = bottone con:
  - Avatar 28px con `entityLogoUrl` o iniziali di `entityName`
  - Riga 1: greeting gendered (Bravo/Brava/Bravə basato su `(profile as any)?.gender`) + ", " + nome utente
  - Riga 2: `entityName` in muted
  - Icona `ChevronsUpDown` a destra
- Dropdown content: Profilo personale, Impostazioni (`basePath + '/settings'`), eventuali `dropdownItems`, separator, Esci (destructive)

**Stile nav items — compatti:**
- `py-1.5` (era `py-2.5`), `space-y-0.5` (era `space-y-1`)
- Icone `h-4 w-4` (era `h-5 w-5`), `gap-2` (era `gap-3`), `rounded-md` (era `rounded-lg`)
- Attivo: `bg-muted font-medium text-foreground border-l-2 border-primary` — no ChevronRight
- Hover: `hover:bg-muted/50`

**Section labels e separatori:** renderizzati inline nel loop degli items basandosi su `sectionLabels` e `separatorAfterIndex`

**ScrollArea:** `h-[calc(100vh-5rem)]` (no footer)

**Mobile header:** solo hamburger button, niente logo/badge

**Bottone X sidebar mobile:** rimane nel header della sidebar (visibile solo lg:hidden), posizionato dopo il dropdown header

---

## 2. `HRLayout.tsx`

- Items: Home (`/hr/home`), Esperienze, Dipendenti, Report (`/hr` — rinomina Dashboard)
- Import `Home`, `LayoutGrid` da lucide-react
- Props: rimuovi `badgeLabel`, `showCompanyLogo`, `dropdownHeader`; aggiungi `entityLogoUrl`, `entityName`, `separatorAfterIndex={[2]}`, `dropdownItems` con "Esplora catalogo"
- Elimina il JSX `dropdownHeader`

## 3. `AssociationLayout.tsx`

- Items: Pagina Host (`/association/profile`, icon Globe), Home (`/association/home`), Esperienze, Calendario, Storico
- Import `Globe`, `Home`; rimuovi `BarChart3`, `Building`
- Props: rimuovi `badgeLabel`; aggiungi `entityLogoUrl`, `separatorAfterIndex={[0]}`

## 4. `SuperAdminLayout.tsx`

- Items riordinati: Home (`/super-admin/home`), Aziende, Associazioni, Esperienze, Utenti, Codici Accesso, Richieste Accesso, Città, Categorie, Email Templates
- Import `Home`; rimuovi `BarChart3`
- Props: rimuovi `badgeLabel`; aggiungi `entityName="Bravo! Team"`, `sectionLabels` (Marketplace@1, Configurazione@5)

