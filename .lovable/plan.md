

# Ricorrenze stile Google Calendar in ManageDatesDialog

## Cosa si costruisce

Dopo la selezione di una data, appare un **Select di ricorrenza** contestuale. Se si sceglie una ricorrenza, compare una sezione "Fine" con 3 opzioni radio (come Google Calendar nello screenshot):

- **Mai** — genera date fino a max 52 settimane (cap di sicurezza)
- **Data** — mostra un date picker per scegliere la data limite
- **Dopo N occorrenze** — input numerico (default 4, max 52)

Le date generate vengono mostrate come anteprima (badge/chip) e inserite in batch.

## Layout nel form

```text
Data *
[Sabato 14 marzo 2026]              [X]

Ricorrenza
[Ogni settimana di sabato        ▼]

Fine
○ Mai
○ Data          [13 giu 2026]
● Dopo          [4] occorrenze

Anteprima (4 date):
 21 mar · 28 mar · 4 apr · 11 apr

Ora inizio *       Ora fine *
[09:00]            [13:00]

[Aggiungi 4 date]
```

## Modifiche — file unico `ManageDatesDialog.tsx`

### Nuovi stati
- `recurrence`: `'none' | 'weekly' | 'biweekly' | 'monthly'` (default `'none'`)
- `endMode`: `'never' | 'date' | 'count'` (default `'count'`)
- `endDate`: `Date | undefined`
- `endCount`: `number` (default 4)

### Select ricorrenza (visibile solo se `selectedDate` esiste)
Opzioni contestuali basate sulla data selezionata:
- "Non si ripete"
- "Ogni settimana di [giorno]" (es. "Ogni settimana di sabato")
- "Ogni 2 settimane di [giorno]"
- "Ogni mese il [N]" (es. "Ogni mese il 14")

### Sezione "Fine" (visibile solo se `recurrence !== 'none'`)
3 radio button con UI ispirata allo screenshot:
- **Mai**: cap a 52 occorrenze
- **Data**: input `type="date"` inline
- **Dopo**: input numerico + label "occorrenze"

### Funzione `generateDates()`
Calcola le date ricorrenti a partire da `selectedDate` usando `addWeeks`/`addMonths` di `date-fns`, filtrando per futuro. Restituisce `Date[]`.

### Anteprima
Se ricorrenza attiva, mostra badge con le date generate (`format(d, "d MMM", { locale: it })`).

### `handleAdd` aggiornato
- Se `recurrence === 'none'`: insert singolo (comportamento attuale)
- Altrimenti: costruisce array da `generateDates()` e fa `supabase.from("experience_dates").insert([...])` batch
- Toast: "X date aggiunte"
- Pulsante mostra conteggio: "Aggiungi 4 date"

### Reset
Al cambio data, chiusura modale, o dopo insert: reset di tutti gli stati ricorrenza.

### Dipendenze
Usa `addWeeks`, `addMonths`, `setDate` da `date-fns` (già nel progetto).

Nessuna modifica al database.

