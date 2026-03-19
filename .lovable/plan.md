

# Piano: Ristrutturazione pannello Associazione

## 1. Estendere `SidebarItem` in `AdminLayout.tsx`

Aggiungere campi opzionali `disabled?: boolean` e `badge?: string` all'interfaccia `SidebarItem`. Nel rendering, se `disabled` e' true: rendere come `span` invece di `Link`, aggiungere `opacity-50 cursor-not-allowed`, e mostrare il badge inline. Retrocompatibile: HR e SuperAdmin non usano questi campi.

## 2. Aggiornare sidebar in `AssociationLayout.tsx`

Nuova configurazione sidebar:
- Profilo Pubblico → `/association/profile`
- (separatore dopo index 0)
- Home → `/association` (non `/association/home`)
- (section label "Servizi alle aziende" prima di index 3)
- Volontariato aziendale → `/association/experiences`
- Team Building → disabled, badge "Presto"
- Formazione → disabled, badge "Presto"
- Consulenza → disabled, badge "Presto"
- Gadget solidali → disabled, badge "Presto"
- Progetti → disabled, badge "Presto"
- (separatore dopo index 8)
- Calendario → `/association/calendar`
- Report → `/association/history`

Icone appropriate per ogni voce (Briefcase, Users, GraduationCap, HeartHandshake, Gift, FolderKanban).

## 3. Creare nuova Home `AssociationHome.tsx`

Sostituisce `AssociationDashboard.tsx`. Contenuto:

- **Saluto**: "Buongiorno, {nome associazione}" + data odierna in italiano
- **Placeholder AI**: Card con bordo tratteggiato, icona sparkle, "Assistente AI Bravo! — Coming Soon"
- **Azioni rapide**: Due bottoni — "Crea esperienza" (naviga a `/association/experiences`) e "Vai al calendario"
- **Due widget affiancati** (grid 2 col desktop, stack mobile):
  - **Prossime attività**: Query date prossimi 7 giorni (riuso logica da AssociationDashboard), max 5, con titolo/data/ora/citta/posti confermati. Link "Vedi tutte" al calendario
  - **Da gestire**: Esperienze in stato `draft`, titolo + badge stato. Click porta a `/association/experiences`. Se vuoto: "Tutto in ordine!"

## 4. Aggiornare routing in `App.tsx`

- Importare `AssociationHome` al posto di `AssociationDashboard`
- Route `/association` punta a `AssociationHome`
- Rimuovere la route `/association/home` se presente
- Eliminare `AssociationDashboard.tsx`

## File coinvolti

| File | Azione |
|------|--------|
| `src/components/layout/AdminLayout.tsx` | Estendere interfaccia + rendering disabled/badge |
| `src/components/layout/AssociationLayout.tsx` | Nuova config sidebar |
| `src/pages/association/AssociationHome.tsx` | Nuovo file — Home operativa |
| `src/pages/association/AssociationDashboard.tsx` | Eliminare |
| `src/App.tsx` | Aggiornare import e route |

Nessuna modifica al database.

