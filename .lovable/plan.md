

# Calendario Associazione — Piano di implementazione

## Cosa si costruisce

Una nuova pagina "Calendario" nel menu associazione che mostra tutte le date programmate in una vista calendario completa con 3 modalità: **Mese** (default), **Settimana** e **Giorno**. Ispirata a Google Calendar per UX/UI.

## Struttura dei file

| File | Azione |
|------|--------|
| `src/pages/association/AssociationCalendarPage.tsx` | Nuovo — pagina principale |
| `src/components/association/calendar/CalendarHeader.tsx` | Nuovo — navigazione + toggle vista |
| `src/components/association/calendar/MonthView.tsx` | Nuovo — griglia mensile |
| `src/components/association/calendar/WeekView.tsx` | Nuovo — griglia settimanale con ore |
| `src/components/association/calendar/DayView.tsx` | Nuovo — vista giornaliera con ore |
| `src/components/association/calendar/EventBlock.tsx` | Nuovo — blocco evento riusabile |
| `src/components/association/calendar/DayDetailPopover.tsx` | Nuovo — popover dettaglio giorno |
| `src/components/layout/AssociationLayout.tsx` | Modifica — aggiunta voce menu |
| `src/App.tsx` | Modifica — aggiunta route |

## Architettura

### Data fetching
- Query su `experience_dates` con join su `experiences` per ottenere titolo, filtrate per `association_id` dell'utente
- Range temporale dinamico in base alla vista (mese ±1 settimana, settimana corrente, giorno)
- Dati caricati una volta e filtrati client-side al cambio vista

### Stato principale (`AssociationCalendarPage`)
```text
currentDate: Date          — data di riferimento per navigazione
viewMode: 'month'|'week'|'day'   — vista attiva (default: month)
events: CalendarEvent[]    — date caricate dal DB
```

### CalendarHeader
- Pulsante "Oggi" per tornare alla data corrente
- Frecce < > per navigare (mese/settimana/giorno in base alla vista)
- Label con mese/anno o range settimana o data giorno
- Toggle segmentato Mese | Settimana | Giorno

### MonthView (vista default)
- Griglia 7 colonne (Lun-Dom), 5-6 righe
- Ogni cella mostra il numero del giorno
- Se ci sono eventi: mini-badge con orario + titolo troncato (stile Google Calendar)
- Se ci sono >2 eventi: mostra i primi 2 + "+N in più"
- Click su giorno con eventi → cambia a vista Giorno
- Click su giorno vuoto → apre ManageDatesDialog (o un form rapido) con data pre-selezionata
- Date passate: testo grigio con opacità ridotta
- Oggi: cerchio colorato sul numero

### WeekView
- 7 colonne (giorni), righe orarie (6:00-22:00)
- Header con giorno della settimana + numero
- Eventi come blocchi posizionati in base a start/end time (height proporzionale alla durata)
- Colore del blocco basato sull'esperienza
- Click su blocco → popover con dettaglio (titolo, orario, posti, azioni)

### DayView
- Singola colonna con griglia oraria (6:00-22:00)
- Header con giorno completo (es. "Venerdì 14 marzo 2026")
- Blocchi evento posizionati verticalmente in base all'orario
- Blocchi affiancati se sovrapposti
- Click su blocco → popover dettaglio con azioni (modifica/elimina)

### EventBlock (componente condiviso)
- Mostra: titolo esperienza, orario, posti confermati/totali
- Colore: palette fissa assegnata per experience_id (hash → colore)
- Click → popover dettaglio

### DayDetailPopover
- Titolo esperienza
- Orario (HH:mm - HH:mm)
- Posti (confermati/max)
- Azioni: Elimina data (con conferma)

## Interazioni chiave

1. **Navigazione fluida**: click su giorno in MonthView → DayView per quel giorno
2. **Creazione rapida**: click su giorno vuoto → apre ManageDatesDialog pre-compilato
3. **Gestione**: dal popover dettaglio si può eliminare la data
4. **Colori**: ogni esperienza ha un colore consistente derivato dall'hash del suo ID

## Menu e routing

- Nuova voce "Calendario" con icona `CalendarDays` tra "Esperienze" e "Storico"
- Route: `/association/calendar`

## Note tecniche

- Nessuna modifica al database
- Riuso di `ManageDatesDialog` per la creazione date dal calendario
- `date-fns` per tutte le manipolazioni (startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, etc.)
- Layout responsive: su mobile la MonthView mostra badge minimali (solo pallino colorato), la WeekView mostra 3 giorni scorrevoli

