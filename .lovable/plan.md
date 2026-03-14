

# Piano: Rimuovere durata dal form esperienza + Modifica date dal calendario

## Analisi impatto `default_hours`

Ho verificato l'intero codebase. Il campo `default_hours` sulla tabella `experiences` **non viene usato da nessun'altra parte** per calcoli. Le "ore di volontariato" (`volunteer_hours`) vengono già calcolate automaticamente in `ManageDatesDialog` dalla differenza tra orario di fine e orario di inizio, e salvate su ogni record `experience_dates`. Tutti i consumatori (borsellino ore, pagina impatto, dashboard HR, dashboard super admin) leggono `volunteer_hours` da `experience_dates`.

Rimuovere il campo dal form è sicuro: nessun dato va perso, nessun calcolo si rompe.

## Modifiche previste

### 1. ExperienceForm.tsx — Rimuovere campo durata
- Rimuovere stato `defaultHours`, validazione, e campo UI
- Rimuovere `defaultHours` dall'interfaccia `ExperienceFormData`
- Il campo `maxParticipants` passa a larghezza piena (non più grid 2 colonne)

### 2. CreateExperienceDialog.tsx — Non passare `default_hours`
- Rimuovere `default_hours: data.defaultHours` sia da insert che da update

### 3. DayDetailPopover.tsx — Aggiungere modifica inline
- Pulsante "Modifica" che attiva modalità editing
- Campi editabili: orario inizio, orario fine, max partecipanti
- Al salvataggio: UPDATE su `experience_dates` con ricalcolo automatico di `volunteer_hours` (differenza ore)
- Pulsanti "Salva" e "Annulla"
- Callback `onUpdated` (riusa `onDeleted` che già triggera il refetch)

### File coinvolti

| File | Modifica |
|------|----------|
| `src/components/association/ExperienceForm.tsx` | Rimuovi campo durata |
| `src/components/association/CreateExperienceDialog.tsx` | Rimuovi `default_hours` dal payload |
| `src/components/association/calendar/DayDetailPopover.tsx` | Aggiungi editing inline |

Nessuna modifica al database necessaria — il campo `default_hours` resta nella tabella (nullable, default null) ma non viene più popolato dal form.

