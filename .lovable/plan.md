# Piano di Implementazione Fase 1 — Roadmap v4.0

## Sprint completati

### ✅ Sprint 0 — Feedback (già implementato)
- Tabella `experience_reviews` + RLS + modal feedback + email post-evento
- Pagina Impact funzionante (booking confirmed + data passata)

### ✅ Sprint 1 — Colonne additive (rischio zero)
- `experiences`: + `type`, `price_per_participant`, `visibility`, `created_by`
- `bookings`: + `verified_at`, `verification_method`, `verification_data`
- `profiles`: + `manager_id`
- `companies`: + `max_concurrent_absences`

### ✅ Sprint 2 — Nuove tabelle (rischio basso)
- `company_service_config` con RLS (HR + super admin)
- `hour_budgets` con RLS (employee read + HR read + super admin full)
- Triggers `updated_at` su entrambe

### ✅ Sprint 3 — Lifecycle booking (rischio medio)
- Function `process_completed_events()` per transizionare booking passati (confirmed → completed dopo 2h dalla fine)
- RLS `experience_reviews` aggiornata per accettare status `completed`
- Frontend retrocompatibile: tutti i filtri accettano sia `confirmed` (passato) che `completed`
- Utility `src/lib/booking-utils.ts` con costanti e helper per gli stati
- Badge `no_show` aggiunto nelle card booking
- **Rollback:** `UPDATE bookings SET status = 'confirmed' WHERE status IN ('completed', 'verified');` + ripristino RLS

### ✅ Sprint 4 — Widget ore dipendente/HR
- Hook `useHourBudget` con logica "nessun budget = illimitato"
- Widget ore nel profilo dipendente e HR admin con skeleton loading
- Calcolo anno fiscale basato su `hour_budgets.fiscal_year_start`

---

## Sprint in corso

### ✅ Sprint Marketplace — Refactoring experience_dates (COMPLETATO)

**Obiettivo:** passare da modello "Push" (date legate a `company_id`) a modello "Pull" (catalogo aperto, visibilità basata su `service_type` + assegnamenti diretti via `experience_companies`).

**Completato:**
- Step 0-4: SQL (funzione `can_employee_see_experience`, nuove RLS `_v2`, drop vecchie policy)
- Step 5: Frontend — `ExperienceDateDialog.tsx` ripulito da `company_id` (campo deprecato, non più usato)
- Step 6: Nuovo componente `VisibilityDialog.tsx` per gestione eventi privati
- Step 7: `ExperiencesPage.tsx` — bottone Lock/Globe per gestire visibilità + badge "Privata" + dialog assegnamenti aziende

**Architettura visibilità:**
- `experiences.visibility`: `'public'` (default) o `'private'`
- `experience_companies`: tabella join per assegnamenti diretti
- `can_employee_see_experience()`: gestisce la logica di accesso
- Super admin può rendere un'esperienza privata e assegnare aziende specifiche dal pannello Esperienze

**`experience_dates.company_id`:** resta nel DB (nullable, deprecato), non più usato nel frontend.

---

## Sprint da fare

### Sprint 4b — Verifica ore pre-prenotazione
- Verifica ore residue pre-prenotazione (frontend only)
- Widget ore in dashboard HR
- Se `hour_budgets` non esiste → budget illimitato (retrocompatibilità)

### Sprint 5 — "Le mie attività" + notifica manager
- Nuova pagina `/app/my-activities`
- Edge Function notifica manager alla prenotazione
- Check tetto assenze contemporanee

---

## Regole di sicurezza
1. Mai DROP + CREATE RLS in un singolo step — usare policy `_v2` affiancate, poi drop delle vecchie
2. Mai ALTER colonne esistenti — solo ADD COLUMN
3. Ogni migrazione reversibile
4. Frontend retrocompatibile con fallback
5. Test su ambiente Test prima di pubblicare
