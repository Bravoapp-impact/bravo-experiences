
Obiettivo: ripristinare le metriche HR (non più tutte a zero) nella tab “Statistiche”.

Diagnosi confermata:
- Le richieste a `experience_dates` stanno fallendo con errore backend `42P17: infinite recursion detected in policy for relation "experience_dates"`.
- Questo errore nasce dalla policy `hr_view_experience_dates_v2` appena introdotta: dentro la policy su `experience_dates` fai una subquery su `bookings`, e le policy di `bookings` a loro volta referenziano `experience_dates` ⇒ loop RLS.
- Quando la query fallisce, `fetchStatsData` non riceve date/esperienze e la UI mostra metriche a zero.

Piano di correzione (mirato e sicuro):
1) Migrazione SQL per eliminare la ricorsione RLS
- Creare una funzione `SECURITY DEFINER` (con `SET row_security = off`) che verifichi lo storico booking aziendale per una data:
  - input: `p_user_id uuid`, `p_date_id uuid`
  - query interna: `bookings` + `profiles` filtrando `company_id` dell’HR e status in `('confirmed','completed','verified')`
  - ritorno boolean.
- Sostituire la policy `hr_view_experience_dates_v2`:
  - `DROP POLICY hr_view_experience_dates_v2 ON public.experience_dates`
  - `CREATE POLICY hr_view_experience_dates_v3 ... USING ( has_role(auth.uid(),'hr_admin') AND ( [condizione catalogo pubblico+servizio abilitato] OR public.hr_has_historical_booking_for_date(auth.uid(), experience_dates.id) ) )`
- Lasciare invariata la policy employee (`employees_view_dates_v2`), così i dipendenti continuano a vedere solo esperienze attivate.

2) Hardening frontend minimo (stesso file già toccato)
- In `fetchStatsData`, se una query restituisce errore (`error` non nullo), loggare esplicitamente l’errore e mostrare stato errore nella tab statistiche (invece di far sembrare “0 reale”).
- Nessun cambio di logica business: la logica booking-driven resta corretta.

3) Verifica funzionale E2E
- Caso 1: HR apre `/hr/volontariato` → tab “Statistiche” mostra di nuovo partecipazioni e fill rate (non zero fittizio).
- Caso 2: rimozione esperienza da “Il mio programma” → lo storico resta visibile nelle metriche.
- Caso 3: dipendente non vede esperienza rimossa nel catalogo (comportamento atteso, invariato).

File coinvolti:
- `supabase/migrations/<nuova_migration>.sql` (nuova funzione + policy v3, rimozione v2)
- `src/pages/hr/HRExperiencesPage.tsx` (gestione errore più esplicita in fetch stats)
