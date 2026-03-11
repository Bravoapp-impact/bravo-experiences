# Piano di Implementazione Fase 1 — Roadmap v3.0

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

---

## Sprint completati recenti

### ✅ Sprint 3 — Lifecycle booking (rischio medio)
- Function `process_completed_events()` per transizionare booking passati (confirmed → completed dopo 2h dalla fine)
- RLS `experience_reviews` aggiornata per accettare status `completed`
- Frontend retrocompatibile: tutti i filtri accettano sia `confirmed` (passato) che `completed`
- Utility `src/lib/booking-utils.ts` con costanti e helper per gli stati
- Badge `no_show` aggiunto nelle card booking
- **Rollback:** `UPDATE bookings SET status = 'confirmed' WHERE status IN ('completed', 'verified');` + ripristino RLS

---

## Sprint da fare
- Verifica ore residue pre-prenotazione (frontend only)
- Widget ore in dashboard HR
- Se `hour_budgets` non esiste → budget illimitato (retrocompatibilità)

### Sprint 5 — "Le mie attività" + notifica manager
- Nuova pagina `/app/my-activities`
- Edge Function notifica manager alla prenotazione
- Check tetto assenze contemporanee

---

## Nota critica: company_id in experience_dates
NON rimuovere `company_id` da `experience_dates` — tutta la RLS multi-tenant dipende da quel campo. Pianificare come operazione dedicata con test approfonditi.

## Regole di sicurezza
1. Mai DROP + CREATE RLS in un singolo step
2. Mai ALTER colonne esistenti — solo ADD COLUMN
3. Ogni migrazione reversibile
4. Frontend retrocompatibile con fallback
5. Test su ambiente Test prima di pubblicare
