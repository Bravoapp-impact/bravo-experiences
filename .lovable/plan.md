# Calendario HR — fix allineamento X sidebar/titolo + gap col calendario

## Diagnosi
Il titolo "Calendario" nel `PageHeader` è preceduto da un'icona (`h-7 w-7`) + `gap-3`, quindi il testo "Calendario" inizia a **~40px** dal bordo sinistro del `<main>`.

La sidebar invece ha solo `px-3` (12px): la checkbox "VOLONTARIATO AZIENDALE" inizia a **~12px**. Da qui il disallineamento visibile nello screenshot (le checkbox sono più a sinistra del titolo).

Sono due "origini" diverse: l'icona del PageHeader sposta il titolo a destra, ma la sidebar non lo segue.

## Modifiche

### 1. `src/components/hr/calendar/CalendarFiltersSidebar.tsx`
Allineare il **primo elemento interattivo della sidebar** (checkbox/label) allo stesso X del **testo "Calendario"**.
- Root `<aside>` (ramo expanded): sostituire `px-3` con `pl-10 pr-3` (40px a sinistra ≈ icona 28px + gap 12px del PageHeader).
- Stessa logica sul ramo collapsed se vogliamo che la freccia sia allineata: lì la sidebar è larga 40px e centrata, va lasciata com'è (è uno stato compresso, l'allineamento perfetto non è critico).

### 2. `src/pages/hr/HRCalendarPage.tsx`
Aggiungere distanza orizzontale tra sidebar e calendario.
- `calendarBody`: aggiungere `pl-6` (24px) al padding già presente:
  ```diff
  - <div className="flex-1 min-w-0 flex flex-col h-full py-4">
  + <div className="flex-1 min-w-0 flex flex-col h-full py-4 pl-6">
  ```
- In alternativa, mettere `gap-6` sul container flex padre. Preferisco `pl-6` sul body per non spingere la sidebar.

## File toccati
- `src/components/hr/calendar/CalendarFiltersSidebar.tsx`
- `src/pages/hr/HRCalendarPage.tsx`
