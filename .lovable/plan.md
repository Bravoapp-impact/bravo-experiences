
Diagnosi rapida:
- Il problema non è nel calcolo delle metriche, ma nel fetch dati della tab Statistiche.
- `fetchStatsData` prende i booking aziendali, poi fa query su `experience_dates` con gli `experience_date_id`.
- Dopo che rimuovi “Ripuliamo Artemisia” da `experience_companies`, la policy `employees_view_dates_v2` (basata su `can_employee_see_experience`) non fa più vedere quelle date.
- Risultato: `datesRaw` torna vuoto, quindi `uniqueExpIds` è vuoto e le metriche si azzerano.

Piano di correzione (mirato):
1) Aggiornare RLS su `experience_dates` con una nuova policy SELECT per HR admin (senza dipendere da `experience_companies`), che consenta visibilità se:
   - la data appartiene a un’esperienza pubblicata/pubblica abilitata per il servizio aziendale, oppure
   - esiste almeno un booking storico di un utente della stessa azienda su quella data.
2) Lasciare invariata la policy employee (`employees_view_dates_v2`): i dipendenti continuano a vedere solo esperienze attivate dall’HR.
3) Mantenere la logica frontend attuale in `HRExperiencesPage.tsx` (booking-driven), perché con la policy HR corretta torna a funzionare anche dopo rimozione dal programma.
4) Aggiungere solo un hardening minimo nel frontend: log/guard esplicito se ci sono booking ma zero date risolte, per diagnosticare subito regressioni RLS future.

Verifica funzionale (E2E):
- Caso A: HR rimuove “Ripuliamo Artemisia” da “Il mio programma” → in “Statistiche” restano visibili partecipazioni e fill rate storici.
- Caso B: Dipendente della stessa azienda non vede più l’esperienza nel catalogo (comportamento atteso).
- Caso C: HR continua a vedere catalogo completo e può riattivare l’esperienza.

File coinvolti:
- `supabase/migrations/<nuova_migration>.sql` (nuova policy SELECT su `experience_dates` per HR)
- `src/pages/hr/HRExperiencesPage.tsx` (solo guard/log difensivo, opzionale ma consigliato)
