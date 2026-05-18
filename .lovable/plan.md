# Calendario HR — layout full-height e divisori continui

## Obiettivo
Riprodurre la sensazione di Google Calendar:
- nessuno spazio bianco tra la nav HR globale e la sidebar dei filtri;
- bordo verticale continuo tra sidebar filtri e calendario, dal top al bottom della viewport;
- celle del MonthView che riempiono lo spazio verticale disponibile (6 righe equidistribuite, niente buco bianco sotto).

## Modifiche

### 1. `src/pages/hr/HRCalendarPage.tsx`
- Wrapper esterno: rimuovere `space-y-4` dove va in conflitto con il blocco full-height. Mantenere il `PageHeader` con i suoi margini normali sopra.
- Il container che racchiude `CalendarFiltersSidebar` + `calendarBody` diventa:
  ```tsx
  <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-180px)]">
  ```
  - margini negativi per annullare il padding orizzontale e bottom del `<main>` di `AdminLayout` (la sidebar dei filtri si attacca alla nav globale e al fondo viewport);
  - `gap-4` rimosso: la separazione visiva la fa il `border-r` della sidebar;
  - `180px` è un valore di partenza da tarare visivamente (header app + `PageHeader` + spacing) per arrivare esattamente al fondo viewport.
- `calendarBody`: passa da `space-y-4` a `flex flex-col h-full`. La toolbar (`CalendarHeader` + bottone mobile filtri) resta in alto come riga fissa con un piccolo margine bottom; la view del calendario (`MonthView`/`WeekView`/`DayView`) ha classe `flex-1 min-h-0` per occupare il resto.
- Aggiungere padding orizzontale interno al `calendarBody` (es. `px-4 sm:px-6 lg:px-8`) per ricreare la gronda persa dai margini negativi, lasciando però la sidebar filtri attaccata al bordo sinistro.
- Mobile (`isMobile`): la sidebar resta `Sheet` come oggi; sul container desktop il layout full-height entra in vigore solo da `md:` o equivalente per non rompere mobile.

### 2. `src/components/hr/calendar/CalendarFiltersSidebar.tsx`
- Root `<aside>`: aggiungere `h-full` (mantiene `flex flex-col` esistente) così il `border-r` si estende fino al fondo della viewport.

### 3. `src/components/calendar/MonthView.tsx`
- Root del componente: da `border rounded-lg overflow-hidden bg-card` a `border rounded-lg overflow-hidden bg-card h-full flex flex-col` (consentire ai contenitori parent di passare l'altezza).
- Header dei giorni: resta fisso (riga grid 7 colonne).
- Grid celle: da
  ```tsx
  <div className="grid grid-cols-7">
  ```
  a
  ```tsx
  <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
  ```
- Cella singola: rimuovere `min-h-[90px] sm:min-h-[110px]`, sostituire con `min-h-[60px]` come fallback per viewport corte e `overflow-hidden` per evitare che troppi eventi sforino la cella.
- Le 6 righe sono garantite da `startOfWeek(monthStart) → endOfWeek(monthEnd)` (sempre 42 celle).

### 4. `src/components/calendar/WeekView.tsx`
- Root: aggiungere `h-full flex flex-col`.
- Sostituire `overflow-y-auto max-h-[600px]` sul grid orario con `flex-1 min-h-0 overflow-y-auto` così si adatta allo spazio disponibile.

### 5. `src/components/calendar/DayView.tsx`
- Stessa logica del WeekView: `h-full flex flex-col` sul root e `flex-1 min-h-0 overflow-y-auto` al posto di `max-h-[600px]`.

### 6. `src/pages/association/AssociationCalendarPage.tsx`
Condivide gli stessi componenti calendario. Per non rompere nulla:
- Avvolgere `CalendarHeader` + view in un container `flex flex-col h-[calc(100vh-180px)]` con la view in `flex-1 min-h-0`, in modo che `MonthView/WeekView/DayView` ricevano l'altezza che ora si aspettano.
- Mantenere il `PageHeader` e il dialog `ManageDatesDialog` invariati.

## Vincoli
- Nessuna modifica a `AdminLayout`, ad altre pagine HR/Association o alla logica di fetch.
- Il drawer mobile dei filtri resta com'è: il layout full-height vale per desktop.
- Da verificare visivamente il valore `100vh - 180px` su 1353×828 (viewport corrente) e a viewport più alte; se serve, esporlo come variabile.

## File toccati
- `src/pages/hr/HRCalendarPage.tsx`
- `src/components/hr/calendar/CalendarFiltersSidebar.tsx`
- `src/components/calendar/MonthView.tsx`
- `src/components/calendar/WeekView.tsx`
- `src/components/calendar/DayView.tsx`
- `src/pages/association/AssociationCalendarPage.tsx`
