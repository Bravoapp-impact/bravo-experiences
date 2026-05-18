## Obiettivo

Trasformare `/hr/calendario` da placeholder a pagina calendario completa (Mese/Settimana/Giorno) riusando i componenti già esistenti del calendario Associazione, senza duplicare codice.

## 1. Estrazione componenti calendar in location condivisa

Sposto la cartella `src/components/association/calendar/` → `src/components/calendar/` (7 file: `CalendarHeader`, `MonthView`, `WeekView`, `DayView`, `EventBlock`, `DayDetailPopover`, `calendar-types`).

I componenti sono già scritti in modo agnostico: `MonthView`/`WeekView`/`DayView` ricevono solo `events` + callback, non sanno nulla dell'associazione. L'unico file con accoppiamento operativo è `DayDetailPopover` (fa update/delete diretto su `experience_dates`).

Aggiorno gli import in `src/pages/association/AssociationCalendarPage.tsx` (5 import). Nessun cambio di comportamento.

## 2. Generalizzazione del `DayDetailPopover` con un prop `mode`

Estendo il popover esistente con un prop `mode: "association" | "hr"` (default `"association"` per retrocompat).

- `mode="association"`: comportamento attuale identico (edit inline + delete + count globale).
- `mode="hr"`: vista read-only. Mostra titolo esperienza, fascia oraria + ore, contatore `{confirmed_count}/{max_participants} dipendenti iscritti`, CTA "Vedi esperienza" che naviga a `/hr/experiences/:experience_id`. Nessuna sezione edit/delete, nessun `AlertDialog`.

In `hr` mode il prop `onDeleted` diventa opzionale (non chiamato).

Scelgo l'estensione invece di un componente separato perché il chrome (popover, header con colore+titolo+data, close button) è identico — separarlo significherebbe duplicare ~40 righe per evitare un branch di ~30.

Il prop viene passato attraverso `MonthView`/`WeekView`/`DayView` come `popoverMode?: "association" | "hr"` (default `"association"`).

## 3. Nuova pagina `src/pages/hr/HRCalendarPage.tsx`

Struttura speculare a `AssociationCalendarPage` ma con:

- `HRLayout` invece di `AssociationLayout`
- `PageHeader` con titolo "Calendario", icona `CalendarDays`, `iconColor="text-cyan-500"`
- `CalendarHeader` senza `onAddDate`/`onExperiencePicked` (HR non aggiunge date)
- `MonthView`/`WeekView`/`DayView` con `popoverMode="hr"` e `onEventDeleted={fetchEvents}` (no-op innocuo)

### Fetch dati (scope HR)

```ts
// Step 1 — esperienze attivate per la mia company
const { data: ec } = await supabase
  .from("experience_companies")
  .select("experience_id")
  .eq("company_id", myCompanyId);
const experienceIds = (ec ?? []).map(r => r.experience_id);

// Step 2 — date in range, RLS filtra automaticamente
//   (hr_view_experience_dates_v5 garantisce company_id IS NULL || = my_company
//    e che l'esperienza sia pubblicata e attivata per la company)
const { data: dates } = await supabase
  .from("experience_dates")
  .select("id, start_datetime, end_datetime, max_participants, company_id, experiences!inner(id, title)")
  .in("experience_id", experienceIds)
  .gte("start_datetime", rangeStart.toISOString())
  .lte("start_datetime", rangeEnd.toISOString());
```

### Contatore "miei colleghi iscritti"

Per ciascuna data il count va calcolato sui soli `bookings` confermati di utenti della mia company:

```ts
// 1. lista dipendenti della company
const { data: emps } = await supabase
  .from("profiles").select("id").eq("company_id", myCompanyId);
const empIds = emps.map(e => e.id);

// 2. bookings confermati limitati a questi user_id
const { data: bookings } = await supabase
  .from("bookings")
  .select("experience_date_id")
  .in("experience_date_id", dateIds)
  .in("user_id", empIds)
  .eq("status", "confirmed");
```

Aggrego in una `Map<dateId, count>` e popolo `confirmed_count` su `CalendarEvent`.

## 4. Route in `src/App.tsx`

Sostituisco:
```tsx
<Route path="/hr/calendario" element={<ProtectedHRRoute><HRPlaceholderPage title="Calendario" /></ProtectedHRRoute>} />
```
con:
```tsx
<Route path="/hr/calendario" element={<ProtectedHRRoute><HRCalendarPage /></ProtectedHRRoute>} />
```

Aggiungo l'import di `HRCalendarPage` (lazy se gli altri HR sono lazy, coerente con il pattern esistente).

## 5. Vincoli rispettati

- Nessuna nuova migration, nessuna RPC: RLS `hr_view_experience_dates_v5` già filtra correttamente.
- Calendario Associazione invariato in comportamento.
- Layout piatto (niente `<Card>` attorno alle viste).
- Loading: `PageSkeleton variant="list"` (stesso del calendario Associazione).

## File toccati

```text
src/components/calendar/                     ← NUOVO (spostato da association/calendar/)
  CalendarHeader.tsx
  MonthView.tsx
  WeekView.tsx
  DayView.tsx
  EventBlock.tsx
  DayDetailPopover.tsx                       ← +prop mode "association"|"hr"
  calendar-types.ts

src/components/association/calendar/         ← RIMOSSA

src/pages/association/AssociationCalendarPage.tsx   ← solo import path
src/pages/hr/HRCalendarPage.tsx              ← NUOVO
src/App.tsx                                  ← route HR aggiornata
```

## Aperti

Nessun decision-point: tutto il comportamento HR è specificato nel brief. Procedo all'implementazione all'approvazione.
