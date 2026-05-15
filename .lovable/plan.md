## Obiettivo
`/hr/experiences/:id` diventa una pagina solo informativa: l'HR vede dettagli + sidebar in stile Airbnb con la lista delle prossime date e numero iscritti per ciascuna. Niente più azioni di curation.

## Cosa cambia

### 1. `src/pages/hr/HRExperienceDetail.tsx`
- Rimuovere stato `isActive`, `isToggling`, `drawerOpen`, funzione `handleToggle`, useEffect `fetchActivation`.
- Rimuovere import e uso di `HRMobileActionDrawer`, `HRRelatedExperiences`, `useIsMobile`, `useToast`, icone `Check`, `Plus`.
- Rimuovere il blocco mobile sticky CTA in fondo al return.
- Rimuovere `relatedExperiencesSlot` dalla chiamata a `ExperienceDetailContent`.
- Non passare più `upcomingDates` a `ExperienceDetailContent` → la sezione "Quando si svolge" sparisce (è già condizionale).
- Estendere il fetch delle date per includere iscritti: dopo il fetch di `experience_dates`, una seconda query `bookings` con `.in("experience_date_id", ids)` filtrando `status != 'cancelled'`, raggruppare client-side per `experience_date_id`, e produrre `HRUpcomingDate[]` con campo `bookings_count`.
- Passare a `HRSidebar` (via `sidebarSlot`): `dates` (array arricchito) e `defaultHours`. Niente più `isActive`/`isToggling`/`onToggle`.
- Cambiare `pb-28 lg:pb-12` → `pb-12` (non c'è più la sticky bar mobile).
- Su mobile la sidebar viene già renderizzata come slot dentro `ExperienceDetailContent` solo desktop (`hidden lg:block`). Per mostrare le info anche su mobile, replicare il blocco sotto al contenuto principale dentro `<HRLayout>`, in un wrapper `lg:hidden mt-8` (così il mobile non resta privo dell'informazione data/iscritti).

### 2. `src/components/hr/HRSidebar.tsx` — redesign Airbnb-style
- Nuova interfaccia props:
  ```
  dates: { id: string; start_datetime: string; end_datetime: string | null; bookings_count: number }[];
  defaultHours?: number | null;
  ```
- Rimuovere `isActive`, `isToggling`, `onToggle`, `Loader2`, `Plus`, paragrafo descrittivo, pulsante toggle.
- Layout (ispirato allo screenshot Airbnb):
  - Wrapper card: `border border-border rounded-2xl bg-card shadow-sm overflow-hidden`.
  - **Header card** (`px-6 pt-6 pb-4`): titolo `Prossime date` (text-base font-semibold), sottotitolo piccolo con durata: `Durata {defaultHours} ore` se presente, altrimenti omesso.
  - **Divisore** sottile `border-t border-border/60`.
  - **Lista date** (`divide-y divide-border/60`):
    - Ogni riga: `px-6 py-4 flex items-center justify-between gap-4`.
    - Sinistra (stack verticale):
      - data formattata in italiano, weekday + giorno + mese (es. `domenica, 17 maggio`), `text-[15px] font-medium text-foreground capitalize`.
      - orario `HH:mm–HH:mm` (se `end_datetime` presente), `text-xs text-muted-foreground mt-0.5`.
    - Destra (allineato a destra):
      - `{count} iscritti` (icona `Users` h-3.5 w-3.5) — pluralizzato (1 iscritto / N iscritti / 0 iscritti).
      - Colore `text-sm` con `text-muted-foreground` per 0, `text-foreground` per ≥ 1. Niente colori di stato (non c'è il concetto di "esaurito" qui — l'HR vede solo il dato).
  - **Limite di 6 righe**, con riga finale `Vedi tutte ({N})` link al calendario HR (`/hr/calendario`) se ci sono più di 6 date. Se la rotta calendario non esiste ancora, sostituire con testo neutro `+{N} altre date`.
  - **Empty state**: se `dates.length === 0`, riga unica `px-6 py-8 text-center text-sm text-muted-foreground` con `Nessuna data programmata`.
- Import: `Users`, niente `Calendar`/`Clock` necessari (l'icona orologio nel header non serve, lasciamo testo). Manteniamo pulizia import.

### 3. File da cancellare
- `src/components/hr/HRMobileActionDrawer.tsx`
- `src/components/hr/HRRelatedExperiences.tsx`

### 4. `src/hooks/queries/experiences/useRelatedExperiences.ts`
- Rimuovere `useRelatedExperiencesForHR` (intera funzione e parte di docstring relativa). `useRelatedExperiencesForEmployee` resta invariata.
- `keys.ts` non viene toccato (`RelatedExperiencesParams` continua a servire per employee).

### 5. Tipo locale
In `HRExperienceDetail.tsx` definire:
```
type HRUpcomingDate = {
  id: string;
  start_datetime: string;
  end_datetime: string | null;
  bookings_count: number;
};
```
Niente modifiche ai tipi condivisi (`UpcomingDateItem`, `Experience`).

## Cosa NON cambia
- Nessuna modifica a RLS, RPC, edge functions, schema DB (la query bookings legge in lettura standard, la RLS già filtra per company_id dell'HR).
- Nessuna modifica al flusso employee, alle review, all'header pagina, al layout HR.
- `ExperienceDetailContent`, `UpcomingDatesSection`, e relativi tipi restano intatti.
- `useRelatedExperiencesForEmployee` resta intatta.

## Note tecniche
- Status booking attivi: filtro `.neq("status", "cancelled")` (allineato al pattern usato altrove nel progetto per i conteggi presenze/iscritti).
- Fetch in singola roundtrip: una sola `select` su `bookings` con `.in("experience_date_id", ids)`; il group-by avviene client-side (lista date piccola, max ~30).
- Formattazione data IT: `new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" })`. Orario con `Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" })`.
- Verifica finale: nessun import morto (rimossi `Check`, `Plus`, `useToast`, `useIsMobile`).
