## Problema

`HRTeamBuildingPage.tsx` mostra l'empty state anche con 9 richieste presenti per la company. Causa: la query su `tb_events` usa l'embed `format:tb_formats(image_url)`, ma `tb_events` non ha FK verso `tb_formats` (le FK sono solo `request_id` e `contract_id`). PostgREST rifiuta l'embed → `useQuery` va in errore → `data` undefined → `hasAny=false` → fallback "Inizia ora".

## Cosa cambia

Recupero dell'immagine per gli "Eventi in programma" via `tb_proposals` invece che via embed inesistente su `tb_events`. Per una richiesta `confirmed`, l'immagine è quella della proposta accettata (`client_status='accepted'`, `is_active=true`), che ha `format_id` → `tb_formats.image_url`.

### Modifiche in `src/pages/hr/HRTeamBuildingPage.tsx`

1. **Query `eventsRes`**: rimuovere l'embed errato. Diventa:
   ```ts
   supabase
     .from("tb_events")
     .select("request_id,title,scheduled_datetime")
     .in("request_id", confirmedOrCompletedIds)
   ```

2. **Nuova query `acceptedProposalsRes`** (in parallelo nelle altre):
   ```ts
   supabase
     .from("tb_proposals")
     .select("request_id, format:tb_formats(image_url)")
     .in("request_id", confirmedOrCompletedIds)
     .eq("client_status", "accepted")
     .eq("is_active", true)
   ```
   (qui l'embed è valido: `tb_proposals.format_id` ha la FK).

3. **Tipi**: rimuovere `format` da `TBEventRow`. Aggiungere mappa `imageByReq: Map<string, string|null>` costruita dalle proposte accettate.

4. **`ScheduledEventCard` e `ArchivedCard`**: ricevono `imageUrl` da `imageByReq.get(req.id)` invece che da `event.format.image_url`. Le archiviate `cancelled` continuano a non avere immagine (placeholder con icona) — comportamento invariato.

### Cosa NON cambia

- Schema DB, RLS, RPC, edge function, email — nessuna modifica.
- Logica `computePill`, sezioni (Eventi in programma / Richieste in corso / Archivio), gestione bozza, routing, dialog, empty state.
- Wizard, pagina dettaglio, super-admin.
- Numero di round-trip: resta 1 + 3 query parallele (proposals/quotes/events) → diventano 1 + 4 (aggiungo accepted-proposals con image), tutte in `Promise.all` con `.in()`. Nessun N+1.
- File `tb-category-icons.ts` non viene toccato.

### Verifica

Dopo il fix, controllo via console che la query restituisca le 9 righe per la company demo e che la sezione "Richieste in corso" si popoli (la company ha 4 in `open`, 1 `confirmed`, 4 `cancelled`).