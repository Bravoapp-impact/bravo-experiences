## Riorganizzazione Sidebar Super Admin

### Obiettivo

1. Spostare "Esperienze" da "Marketplace" a una nuova sezione "Volontariato Aziendale" (parallela a "Team Building")
2. Rendere le sezioni della sidebar espandibili/collassabili per ridurre lo spazio occupato

### Nuova struttura sidebar

```
Home

Entità (espandibile)
  - Aziende
  - Associazioni
  - Utenti

Volontariato Aziendale (espandibile, chiusa di default)
  - Esperienze

Team Building (espandibile, chiusa di default)
  - Catalogo TB
  - Richieste TB

Configurazione (espandibile, chiusa di default)
  - Codici Accesso
  - Richieste Accesso
  - Città
  - Categorie
  - Email per azienda
```

"Home" resta fuori dalle sezioni. Le sezioni sono chiuse di default. La sezione che contiene la rotta attiva resta sempre aperta.

### Modifiche tecniche

`**src/components/layout/AdminLayout.tsx**`

- Estendere il tipo `SidebarItem` (o introdurre un tipo `SidebarSection`) per supportare gruppi espandibili con `label`, `defaultOpen`, e lista di item figli.
- Sostituire il rendering attuale basato su `sectionLabels` + `separatorAfterIndex` con gruppi `Collapsible` (già disponibile via `@radix-ui/react-collapsible` in `src/components/ui/collapsible.tsx`).
- Header gruppo: label minuscola/uppercase come ora + chevron che ruota su open/closed. Click ovunque sull'header espande/collassa.
- Auto-apertura: se una rotta figlia è attiva, forzare il gruppo aperto (controllato via `open`/`onOpenChange` con stato locale, inizializzato da `defaultOpen` + check rotta).
- Mantenere retrocompatibilità: gli altri layout (`HRSidebar`, `AssociationLayout`, `HRLayout`) usano ancora `AdminLayout`. Se nessuno passa `sections`, fallback al rendering flat attuale per non rompere nulla.

`**src/components/layout/SuperAdminLayout.tsx**`

- Riorganizzare gli item nella nuova struttura a sezioni (vedi sopra).
- Passare `sections` invece di `sidebarItems` flat + `sectionLabels`.

**Nessuna modifica** a route, permessi, pagine o logica di business. Solo presentazione sidebar.

### Note

- Se preferisci che anche le sidebar HR/Association diventino espandibili in un secondo momento, lo facciamo in una task separata.
- Se vuoi un comportamento "accordion" (solo una sezione aperta alla volta) invece che multi-open, dimmelo prima dell'implementazione.