## Problema

La pagina `/app/bookings` resta in caricamento perché la query genera un runtime error:
`Cannot read properties of null (reading 'associations')` a `MyBookings.tsx:82`.

La query attuale fa un join annidato `bookings → experience_dates → experiences → associations:association_id`. Il join su `associations` ora torna `null` per i dipendenti (RLS della tabella `associations` non li include), e in alcuni record anche `experience_dates` o `experiences` può essere null (es. esperienza/data eliminata). Il `.map` esplode → `setBookings` non viene mai chiamato → loader infinito.

## Soluzione

Applichiamo lo stesso pattern già usato per HR e per il catalogo employee: niente join diretto su `associations`, ma fetch secondaria da `associations_public` (già in modalità definer, leggibile da `authenticated`).

### Modifiche a `src/pages/MyBookings.tsx`

1. Rimuovere dal `select` il sotto-join `associations:association_id (...)`. Mantenere solo `association_id` tra i campi di `experiences` per poter fare la lookup.
2. Dopo la fetch dei bookings:
   - Estrarre gli `association_id` unici (filtrando null e gestendo `experience_dates`/`experiences` eventualmente null).
   - Fare una singola query `supabase.from("associations_public").select("id, name, logo_url").in("id", ids)` se ci sono id.
   - Costruire una `Map<id, {name, logo_url}>`.
3. Nel transform:
   - Saltare in modo difensivo i booking con `experience_dates` o `experiences` null (così niente più crash).
   - Popolare `association_name` e `association_logo_url` dalla mappa, con fallback al campo legacy `experiences.association_name`.
4. Avvolgere la logica in `try/catch/finally` per garantire che `setLoading(false)` venga sempre chiamato anche in caso di errore (così la pagina non resta più "appesa" in futuro).

### Nessuna altra modifica

- Nessun cambio a DB, RLS, view o ad altri file.
- Comportamento UI invariato: stesse card, stesso ordine, stessi fallback testuali.

## Verifica post-implementazione

- Aprire `/app/bookings` come dipendente: la pagina carica, mostra prossime e passate.
- Le card delle prenotazioni mostrano nome/logo dell'associazione corretto (anche per esperienze recenti come "Il Balzo ETS").
- Nessun runtime error in console.
