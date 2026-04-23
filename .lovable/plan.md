

## Piano: Pagina dettaglio richiesta TB con matching automatico

### Panoramica

Dopo aver inviato il brief, HR atterra sulla pagina `/hr/team-building/:id` dove vede le migliori proposte di format selezionate automaticamente dal sistema. HR può esprimere interesse sui format e richiedere una quotazione.

### Modifica 1 — Funzione DB di matching automatico

Creare una funzione `match_tb_formats_for_request(p_request_id uuid)` con `SECURITY DEFINER` che:

1. Legge i parametri della `tb_request` (partecipanti, budget, luoghi, categorie preferite)
2. Filtra i `tb_formats` pubblicati in base a:
   - **Città**: almeno una città in `tb_format_cities` che corrisponde ai luoghi selezionati dall'HR (match su nome provincia), oppure format con `nationwide = true`
   - **Partecipanti**: range del format compatibile col range della richiesta (overlap)
   - **Budget**: `price_range_min` del format non superiore al budget dichiarato (se indicato)
   - **Categoria**: bonus di priorità se `category_id` del format corrisponde a una delle `preferred_activities`
3. Ordina per punteggio di compatibilità e seleziona i top 5
4. Crea una `tb_proposal` per ciascun format selezionato (con `client_status = 'pending'`, `priority` in ordine)
5. Aggiorna lo status della `tb_request` a `proposals_ready`
6. Restituisce le proposals create

La funzione viene chiamata una sola volta, al momento del submit del brief. Se le proposals esistono già, non ne crea di nuove.

### Modifica 2 — Redirect post-submit alla pagina dettaglio

In `HRNewTBRequestPage.tsx`, dopo l'insert della `tb_request`:
- Catturare l'ID della request appena creata
- Chiamare la funzione di matching
- Navigare a `/hr/team-building/{id}` invece di `/hr/team-building`

### Modifica 3 — Nuova pagina `/hr/team-building/:id`

Nuova pagina `src/pages/hr/HRTBRequestDetailPage.tsx` con:

- **Header**: titolo della richiesta, stato, data creazione
- **Riepilogo brief**: partecipanti, periodo, luoghi, budget (compatto, tipo card riassuntiva)
- **Sezione proposte**: titolo "Le migliori proposte per il tuo evento «{title}»"
  - Griglia di 3-5 card (una per `tb_proposal`), ciascuna con:
    - Immagine del format (da `tb_formats.image_url`)
    - Titolo del format
    - Descrizione breve (troncata)
    - Categoria, durata, range partecipanti
    - **Nessun prezzo, nessun nome ETS**
    - Bottone/stato per esprimere interesse: "Interessato" / "Non interessato"
  - Le card sono cliccabili per aprire un dialog/drawer con il dettaglio completo del format
- **Footer azione**: quando HR ha espresso interesse su almeno un format, pulsante "Richiedi quotazione" che aggiorna `client_status` delle proposals e lo status della request

### Modifica 4 — Funzione DB per leggere i format nelle proposals

Poiché HR non può leggere `tb_formats` direttamente (RLS super_admin only), creare una funzione `get_tb_proposal_details(p_request_id uuid)` con `SECURITY DEFINER` che:
- Verifica che l'utente chiamante sia HR della company proprietaria della request
- Restituisce le proposals con i dati del format (titolo, descrizione, immagine, categoria, durata, partecipanti range) — escludendo prezzi e info ETS

### Modifica 5 — Route e navigazione

- Aggiungere route `/hr/team-building/:id` in `App.tsx`
- Aggiornare le card in `HRTeamBuildingPage.tsx` per navigare a `/hr/team-building/{req.id}` al click

### Modifica 6 — Aggiornamento `docs/tb-flow.md`

Aggiornare la sezione Fase 2 per documentare il matching automatico: il sistema propone automaticamente i migliori format al momento del submit del brief. Il super admin può successivamente modificare/aggiungere proposte manualmente.

### File coinvolti

| File | Azione |
|------|--------|
| Migration SQL | Funzioni `match_tb_formats_for_request` e `get_tb_proposal_details` |
| `src/pages/hr/HRTBRequestDetailPage.tsx` | Nuovo — pagina dettaglio richiesta |
| `src/pages/hr/HRNewTBRequestPage.tsx` | Modifica — redirect post-submit + chiamata matching |
| `src/pages/hr/HRTeamBuildingPage.tsx` | Modifica — click su card naviga al dettaglio |
| `src/App.tsx` | Modifica — nuova route |
| `docs/tb-flow.md` | Aggiornamento documentazione |

### Note tecniche

- Il matching automatico è un "first pass": il super admin potrà sempre modificare le proposte dal suo pannello
- La funzione di matching usa `SECURITY DEFINER` per bypassare l'RLS su `tb_formats` e `tb_format_cities`
- I dati sensibili (prezzi ETS, margini) non vengono mai esposti all'HR

