# Sidebar Calendario — allineamento a sinistra

## Diagnosi
La sidebar ha attualmente `pl-10 pr-3`: avevo aggiunto 40px di padding-left per allineare il primo elemento al **testo** "Calendario" (che è spostato a destra dall'icona 28px + gap 12px del `PageHeader`).

Lo spazio rosso che evidenzi è proprio questo `pl-10`. Vuoi invece che la sidebar parta dal **bordo sinistro del `<main>`** (lo stesso X dell'icona calendario azzurra).

## Modifica

### `src/components/hr/calendar/CalendarFiltersSidebar.tsx` (riga 80)
Ramo expanded della `<aside>`:

```diff
- <aside className="w-[260px] bg-background shrink-0 flex flex-col h-full pl-10 pr-3">
+ <aside className="w-[260px] bg-background shrink-0 flex flex-col h-full pr-3">
```

Risultato:
- "FILTRI", la checkbox di "VOLONTARIATO AZIENDALE" e le esperienze partono dall'X dell'icona calendario (bordo sinistro del main, dato dal `px-6` di `AdminLayout`).
- Il calendario resta alla distanza attuale grazie al `pl-6` su `calendarBody`.
- La sidebar si riduce nettamente in spazio sprecato a sinistra.

## File toccati
- `src/components/hr/calendar/CalendarFiltersSidebar.tsx`
