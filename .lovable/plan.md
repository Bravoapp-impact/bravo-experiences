## Obiettivo

Aggiungere alla pagina `/hr/calendario` una sidebar laterale stile Google Calendar che permetta di filtrare gli eventi mostrati per esperienza, raggruppati per macro-categoria (Volontariato aziendale oggi, predisposto per Team Building in futuro).

## Layout pagina

```text
┌─────────────────────────────────────────────────────────┐
│ PageHeader: Calendario                                  │
├──────────┬──────────────────────────────────────────────┤
│ Filtri   │ CalendarHeader (Oggi, nav, viste)            │
│          ├──────────────────────────────────────────────┤
│ ▼ Volont.│                                              │
│  ☑ ● Es1 │            MonthView / WeekView / DayView    │
│  ☑ ● Es2 │            (riceve `events` già filtrati)    │
│  ☑ ● Es3 │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

- Flex orizzontale: sidebar `w-[260px]` con `border-r border-border`, contenuto cresce a riempire.
- Bottone toggle (icona chevron) in cima alla sidebar per collassare a una colonnina stretta (`w-10`) che mostra solo l'icona di espansione. Stato persistito in `localStorage` (chiave `hr-calendar-filters-collapsed`).
- Mobile (`<lg`): la sidebar diventa un drawer (shadcn `Sheet`) aperto da un bottone in alto a sinistra del `CalendarHeader`.

## Componente nuovo: `CalendarFiltersSidebar`

Path: `src/components/hr/calendar/CalendarFiltersSidebar.tsx`.

Props:
- `groups: Array<{ id: string; label: string; experiences: { id: string; title: string }[] }>`
- `selectedIds: Set<string>`
- `onChange: (next: Set<string>) => void`
- `collapsed: boolean`
- `onCollapsedChange: (c: boolean) => void`

Struttura interna:
- Header con titolo "Filtri" e bottone chevron (toggle collapsed).
- Per ogni gruppo: header collassabile (shadcn `Collapsible`) con:
  - Checkbox "Tutte" in tristate (none / some / all) che attiva o disattiva tutto il gruppo.
  - Label del gruppo (es. "Volontariato aziendale").
- Lista esperienze del gruppo:
  - `<Checkbox>` shadcn + pallino colore 10px (`getEventColor(exp.id)` come `background`) + titolo troncato a 1 riga (`truncate`) con `Tooltip` per il nome completo.
- Empty state per gruppo vuoto: testo muted "Nessuna esperienza nel programma".
- Quando `collapsed`: mostra solo i pallini colore impilati verticalmente, senza testo (compatto).

Architettura pronta per più gruppi: la prop `groups` è un array, quindi aggiungere Team Building in futuro è solo aggiungere un elemento all'array nella pagina. In v1 viene passato un singolo gruppo "Volontariato aziendale". Nel codice della pagina lasciare un `// TODO: aggiungere gruppo Team Building quando tb_events sono consolidati`.

## Modifiche a `HRCalendarPage`

1. Nuovo stato:
   - `experiencesList: { id; title }[]` — derivato da `experience_companies` × `experiences` (status `published`) della company. Fetchato una volta (separato dal range).
   - `selectedIds: Set<string>` — inizializzato con tutti gli id quando `experiencesList` arriva. Default = tutto selezionato.
   - `filtersCollapsed: boolean` — letto da `localStorage`.

2. Fetch esperienze: nuovo `useEffect`/callback `fetchExperiences()` che query `experience_companies` join `experiences` filtrate per `company_id` e `status='published'`, ordinate per `title`. Quando arriva, se `selectedIds` è `null/empty` lo inizializza con tutti gli id. Quando arrivano nuove esperienze (aggiunte dopo) le considera selezionate per default.

3. Filtro client-side: `const visibleEvents = useMemo(() => events.filter(e => selectedIds.has(e.experience_id)), [events, selectedIds])`. Passato a `MonthView/WeekView/DayView`.

4. Layout: wrappare il contenuto in un `<div className="flex gap-0">` con la sidebar a sinistra e il calendario a destra (`flex-1 min-w-0`). La `PageHeader` resta sopra a tutta larghezza.

5. Mobile: usare `useIsMobile` (o classi responsive) per renderizzare la sidebar come `Sheet` apribile da un `Button` con icona `SlidersHorizontal` posizionato accanto al `CalendarHeader`.

## Vincoli rispettati

- Componenti `MonthView/WeekView/DayView/CalendarHeader/DayDetailPopover` invariati: già accettano `events` come prop, basta passare l'array filtrato.
- `getEventColor` riusato da `calendar-types.ts` per i pallini.
- Style Attio-flat: niente Card wrapper sulla sidebar, solo `border-r`.
- Empty state per company senza esperienze.

## File toccati

- `src/components/hr/calendar/CalendarFiltersSidebar.tsx` (nuovo).
- `src/pages/hr/HRCalendarPage.tsx` (fetch esperienze, stato filtri, layout flex, drawer mobile).