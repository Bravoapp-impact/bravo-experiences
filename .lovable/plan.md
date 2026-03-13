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

### 🔄 Sprint Marketplace — Refactoring experience_dates (IN CORSO)

**Obiettivo:** passare da modello "Push" (date legate a `company_id`) a modello "Pull" (catalogo aperto, visibilità basata su `service_type` + assegnamenti diretti via `experience_companies`).

**Sequenza di implementazione:**

| Step | Cosa | Chi |
|------|------|-----|
| 0 | Seed `company_service_config` — INSERT 'volunteering' per tutte le companies | SQL manuale |
| 1 | Funzione `can_employee_see_experience(p_user_id, p_experience_id)` | SQL manuale |
| 2 | Nuove RLS policy `_v2` su experiences, experience_dates, bookings | SQL manuale |
| 3 | Test funzionale | Manuale |
| 4 | Drop vecchie policy | SQL manuale |
| 5 | Frontend: `ExperienceDateDialog.tsx` — company_id opzionale | Lovable |
| 6 | Aggiorna plan.md | Lovable |

**Logica visibilità (`can_employee_see_experience`):**
```sql
CREATE OR REPLACE FUNCTION can_employee_see_experience(p_user_id uuid, p_experience_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company_id uuid; v_visibility text;
BEGIN
  SELECT company_id INTO v_company_id FROM profiles WHERE id = p_user_id;
  IF v_company_id IS NULL THEN RETURN false; END IF;

  -- Check 1: assegnamento diretto
  IF EXISTS (SELECT 1 FROM experience_companies
             WHERE experience_id = p_experience_id AND company_id = v_company_id)
  THEN RETURN true; END IF;

  -- Check 2: se private → non visibile
  SELECT visibility INTO v_visibility FROM experiences WHERE id = p_experience_id;
  IF v_visibility = 'private' THEN RETURN false; END IF;

  -- Check 3: catalogo aperto se service_type abilitato
  RETURN EXISTS (
    SELECT 1 FROM company_service_config
    WHERE company_id = v_company_id AND enabled = true
      AND service_type = (SELECT type FROM experiences WHERE id = p_experience_id)
  );
END; $$;
```

**File frontend da modificare:**
- `ExperienceDateDialog.tsx` — company_id diventa opzionale, label "Azienda esclusiva (opzionale)"
- `Experiences.tsx` — nessuna modifica (RLS sufficiente)
- `HRExperiencesPage.tsx` — **nessuna modifica** (da affrontare separatamente con policy HR dedicata)

**Posti:** pool condiviso, `max_participants` globale per data.

**`experience_dates.company_id`:** resta nel DB (nullable, deprecato), non più usato nelle nuove policy.

**Rollback:** ricreare le 3 policy originali con check su `ed.company_id`, drop delle `_v2`.

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
