## Obiettivo
Allineare la documentazione alle modifiche del 16/05/2026: modello a 2 assi per l'esclusività delle esperienze di volontariato, cleanup RLS, trigger DB di consistenza, refactor UI `VisibilityDialog`.

## File da aggiornare

### 1. `docs/volunteering.md`

**§4 — `experiences`**
Aggiungere il campo `visibility` enum `public` / `private`:
- `public` = condivisa, attivabile per più aziende via `experience_companies`
- `private` = esclusiva di una sola azienda (vincolato da trigger DB, vedi sotto)

**§4 — `experience_companies`**
Aggiungere nota su trigger di consistenza:
- `enforce_private_single_company_on_bridge` (BEFORE INSERT) blocca una seconda riga se l'esperienza è `private`
- `enforce_private_single_company_on_experiences` (BEFORE UPDATE OF visibility) blocca il passaggio a `private` se nel bridge ci sono già >1 aziende
- Messaggi di errore in italiano

**§4 — `experience_dates`**
Riscrivere la descrizione di `company_id` esplicitando il modello a 2 assi indipendenti:
- Asse esperienza (`experiences.visibility`) e asse data (`experience_dates.company_id`) sono indipendenti
- Una stessa esperienza condivisa può avere date aperte (NULL) e date riservate ad aziende diverse (caso "canile alternato": A il 1°/3° mercoledì, B il 2°/4°)
- **Solo il super-admin** imposta `company_id` sulle date. L'ETS crea date sempre aperte (RLS `WITH CHECK` impedisce all'ETS di valorizzare `company_id`)

**§4 — sezione RLS implicite**
Sostituire i riferimenti alle policy legacy con le versioni correnti:
- `hr_view_experience_dates_v4` → `hr_view_experience_dates_v5` (rimuove filtro `visibility = 'public'`, bug che escludeva date di esperienze private; mantiene filtro attivazione `experience_companies` e `company_id IS NULL OR my_company`)
- `employees_view_dates_v2` → `employees_view_dates_v3` (aggiunge filtro `company_id IS NULL OR my_company`, bug v2 che mostrava date riservate ad altre aziende)
- Policy ETS legacy → `association_manage_own_experience_dates_v2` (ETS gestisce proprie date, `WITH CHECK` impedisce di valorizzare `company_id`)
- Nota su falla chiusa: rimosse `HR admin can activate experiences for own company` (INSERT) e `HR admin can deactivate experiences for own company` (DELETE) su `experience_companies` — HR non scrive più sul bridge
- Nota su duplicate rimosse: `HR admin can view own company experience_companies`, `Admins can view all experience dates`, `Admins can view all experiences`

**§2.5 — responsabilità super-admin**
Aggiungere "Riservare date a singole aziende (`experience_dates.company_id`)" all'elenco delle responsabilità operative super-admin.

### 2. `docs/architettura.md`

**§3 RLS — pattern**
Aggiungere paragrafo "Trigger DB di consistenza esclusività" che documenta:
- Funzione `public.enforce_private_experience_single_company()`
- Due trigger gemelli su `experience_companies` (INSERT) e `experiences` (UPDATE OF visibility)
- Garantiscono che `visibility = 'private'` ⇔ al più 1 riga nel bridge
- Pattern: trigger come ultimo livello di difesa quando un invariante di dominio non è esprimibile come RLS

### 3. `docs/log.md`

Nuova entry in cima:

```
### 2026-05-16 — Volontariato: modello esclusività a 2 assi + cleanup RLS

**Contesto.** Il modello di esclusività delle esperienze era ambiguo a livello DB: nessun vincolo impediva a un'esperienza `private` di avere più aziende nel bridge, le RLS HR/dipendente avevano bug (HR non vedeva date di esperienze private; dipendenti vedevano date riservate ad altre aziende), e HR aveva ancora INSERT/DELETE su `experience_companies` (residuo del modello in cui HR curava il catalogo).

**Cosa cambia.**
- Modello a 2 assi indipendenti formalizzato: asse esperienza (`experiences.visibility`) + asse data (`experience_dates.company_id`). Caso d'uso target: "canile alternato" con date riservate a aziende diverse sulla stessa esperienza condivisa.
- RLS migrate in 2 blocchi (add-then-drop): `hr_view_experience_dates_v5`, `employees_view_dates_v3`, `association_manage_own_experience_dates_v2` aggiunte; legacy v4/v2/ETS rimosse.
- Falla sicurezza chiusa: rimosse policy HR INSERT/DELETE su `experience_companies` (curation è solo super-admin).
- Duplicate rimosse: `HR admin can view own company experience_companies`, `Admins can view all experience dates`, `Admins can view all experiences`.
- Trigger DB di consistenza: `enforce_private_experience_single_company()` con 2 trigger (BEFORE INSERT su bridge, BEFORE UPDATE OF visibility su experiences) — `private` ⇔ ≤1 azienda nel bridge.
- UI: `VisibilityDialog` refactorato. Toggle "Condivisa"/"Esclusiva" al posto dello Switch "privata". Esclusiva = RadioGroup single-select (azienda obbligatoria). Condivisa = Checkbox multi-select. Sequenza salvataggio: DELETE bridge → UPDATE visibility → INSERT bridge (rispetta il trigger).

**Impatto.** `DB schema` · `RLS` · `UI` · `Docs`

**File / aree toccate.**
- `experience_dates`, `experience_companies`, `experiences` (policy + trigger)
- `src/components/super-admin/VisibilityDialog.tsx`
- `docs/volunteering.md`, `docs/architettura.md`

**Follow-up.** `ExperiencesPage.tsx` (super-admin) ancora legge `visibility === "private"` per i badge: rinominare etichette UI in "Esclusiva"/"Condivisa" per coerenza con il nuovo copy del dialog.
```

## Note
- Nessuna modifica a `mem://` (le decisioni sono già coperte da memorie esistenti o nel log).
- Nessuna modifica a codice o DB.
- Tono e formato coerenti con le entry esistenti.
