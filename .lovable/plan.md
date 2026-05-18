# Calendario HR — allineamento sidebar al titolo + cleanup divisori + altezza piena

## Obiettivo
1. `PageHeader` "Calendario" resta sopra. La `CalendarFiltersSidebar` parte dallo stesso X del titolo.
2. Tutto il contenuto della sidebar (header "FILTRI", label gruppo "VOLONTARIATO AZIENDALE", sotto-voci con checkbox+pallino+nome) parte dallo stesso bordo sinistro — niente indentazione progressiva.
3. Nessun `border-r` verticale tra sidebar e calendario.
4. Il calendario riempie l'altezza disponibile della pagina; nei mesi a 5 settimane le celle sono più alte (niente riga vuota).

## Modifiche

### 1. `src/pages/hr/HRCalendarPage.tsx`
- Container full-height: rimuovere i margini negativi orizzontali; tenere solo quelli verticali per attaccarsi al fondo.
  ```diff
  - <div className="flex -mx-4 sm:-mx-6 lg:-mx-6 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-180px)]">
  + <div className="flex -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-180px)]">
  ```
  Così sidebar e titolo condividono lo stesso `px-6` del `<main>` e partono dallo stesso X.
- `calendarBody`: rimuovere `px-4 sm:px-6 lg:px-6` (ora ridondante).
- Tarare `h-[calc(100vh-180px)]` se serve dopo i cambi (il valore dipende da header app + `PageHeader`).

### 2. `src/components/hr/calendar/CalendarFiltersSidebar.tsx`
- Root `<aside>` (entrambi i rami): rimuovere `border-r border-border`.
- **Allineamento contenuto sidebar**: tutti i blocchi partono dallo stesso `pl-0` interno.
  - Header "FILTRI": cambiare `px-3` in `px-0` (con eventuale `gap` invariato).
  - `FilterGroupBlock` wrapper: cambiare `px-2 pb-2` in `pb-2` (no padding-left).
  - Riga label gruppo: rimuovere `px-1` (lasciare solo `py-1.5`).
  - `CollapsibleContent`: cambiare `pl-6 space-y-0.5` in `space-y-0.5` (niente indent rispetto alla label).
  - Singola voce esperienza (`<label>`): rimuovere `px-1` (lasciare `py-1` e `gap-2`).
- Mantenere il `border-b border-border` sotto la riga "FILTRI" (divisore orizzontale interno).
- Aggiungere un padding orizzontale **unico** al contenitore esterno della sidebar (es. `px-3` sul root `<aside>`) per non incollare le voci al bordo. In questo modo tutto il contenuto è allineato a uno stesso X interno alla sidebar.

### 3. `src/components/calendar/MonthView.tsx`
- Calcolare il numero di settimane: `const weeks = days.length / 7;`.
- Sostituire `grid-rows-6` con uno style inline (per evitare problemi col purge Tailwind):
  ```tsx
  <div
    className="grid grid-cols-7 flex-1 min-h-0"
    style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}
  >
  ```
- Le celle riempiono lo spazio verticale: in mesi a 5 settimane risultano più alte; in mesi a 6, più basse.

### 4. Altezza piena del blocco calendario
- Mantenere `h-[calc(100vh-180px)]` come oggi, ma rifinire il valore dopo aver rimosso i `-mx`. Se necessario, sostituire con una variabile CSS o `flex-1 min-h-0` ereditato dal parent `<main>` (richiede `min-h-screen flex flex-col` su `AdminLayout`; più invasivo — da fare solo se la costante non basta).

## File toccati
- `src/pages/hr/HRCalendarPage.tsx`
- `src/components/hr/calendar/CalendarFiltersSidebar.tsx`
- `src/components/calendar/MonthView.tsx`
