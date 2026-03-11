# Fix: Modale centrata e diagnostica prenotazione

## Problema 1: Impossibile prenotarsi

L'utente ha gia' una prenotazione confermata per l'unica data futura disponibile (27 marzo). Il vincolo di unicita' impedisce correttamente una seconda prenotazione per la stessa data. L'errore "23505" viene gestito con il messaggio "Sei gia' prenotato per questa data".

Ad ogni modo, nella tab prenotazioni non è neanche possibile cancellare una prenotazione. Forse la modifica alla modale precedente ha cambiato la visualizzazione del pulsante in fondo?  
  
Nel caso permettere di fare azioni all'utente mostrando i pulsanti. Ad esempio prima veniva comunque mostrato un pulsante per prenotarsi ma l'app restituiva errore se utente era già prenotato per l'evento

## Problema 2: Modale non centrata su mobile

La classe `items-end` nel backdrop posiziona la modale in basso. Va cambiata in `items-center` per centrarla anche su mobile.

## Modifiche

### `src/components/common/BaseModal.tsx`

- Cambiare `items-end sm:items-center` in `items-center` nel backdrop (riga 47)

### `src/components/experiences/ExperienceDetailModal.tsx`

- Nel step "dates", recuperare le prenotazioni esistenti dell'utente per le date disponibili
- Disabilitare le date gia' prenotate con label "Gia' prenotato" invece di renderle selezionabili