

# Sprint 4 — Borsellino Ore (Hour Budget)

## Riepilogo

Budget ore gestito **solo dal Super Admin** nel form di modifica azienda. L'HR lo vede in dashboard (sola lettura). Il dipendente viene bloccato se supera il budget.

## Modifiche

### 1. Migrazione DB

**Funzione `check_hour_budget`** (SECURITY DEFINER, row_security off):
- Dato `user_id` e `experience_date_id`, recupera `company_id` da `user_tenants`
- Cerca il record `hour_budgets` per quella company (piu' recente)
- Se non esiste o `hours_per_employee_year = 0` → ritorna `true` (illimitato)
- Calcola inizio anno fiscale corrente dal campo `fiscal_year_start`
- Somma `volunteer_hours` dei bookings confirmed/completed dell'anno fiscale
- Ritorna `(usate + nuove) <= budget`

**Aggiornamento RLS INSERT su bookings**:
- DROP policy "Users can create bookings"
- Ricreare con condizione aggiuntiva: `AND check_hour_budget(auth.uid(), experience_date_id)`

**RLS INSERT/UPDATE su `hour_budgets` per Super Admin** (attualmente manca INSERT/UPDATE — solo SELECT esiste per employees e HR):
- Policy INSERT/UPDATE per `super_admin` (gia' coperta dalla policy ALL esistente — verificare)

### 2. Super Admin — form azienda (`CompaniesPage.tsx`)

Aggiungere nel dialog di modifica azienda due campi:
- **Budget ore annuale per dipendente** (input numerico, default 0 = illimitato)
- **Inizio anno fiscale** (date picker, default 1 gennaio)

Al salvataggio, fare upsert su `hour_budgets` con `company_id`, `hours_per_employee_year`, `fiscal_year_start`.

### 3. Hook `useHourBudget.ts` (nuovo)

```typescript
// Ritorna { budgetHours, usedHours, remainingHours, isUnlimited, loading }
// Query hour_budgets + calcolo ore usate da bookings nell'anno fiscale
```

Riutilizzabile da dipendente, HR e Super Admin.

### 4. Dipendente — `ExperienceDetailModal.tsx`

Nello step "dates":
- Usare `useHourBudget` per recuperare ore rimanenti
- Se budget esaurito: banner arancione + disabilitare conferma
- Se la data selezionata supera le ore rimanenti: disabilitare conferma con messaggio
- Se illimitato: nessun cambiamento visivo

### 5. HR Dashboard — sola lettura

In `HRDashboard.tsx`:
- Fetch `hour_budgets` per la company
- Passare a `MetricsCards` il budget configurato

In `MetricsCards.tsx`:
- Aggiungere card "Budget Ore" che mostra il valore configurato (es. "16 ore/anno") o "Illimitato"
- La card e' informativa, nessun link di modifica

### 6. Dashboard dipendente — widget ore

Nella pagina `Experiences.tsx` (home del dipendente):
- Se budget configurato, mostrare sotto la search una card compatta con progress bar: "Ore utilizzate: X / Y"

## File coinvolti

| File | Tipo |
|------|------|
| Migrazione SQL | `check_hour_budget` + RLS bookings + helper |
| `src/hooks/useHourBudget.ts` | Nuovo |
| `src/pages/super-admin/CompaniesPage.tsx` | Modifica — campi budget nel form |
| `src/components/experiences/ExperienceDetailModal.tsx` | Modifica — banner + blocco |
| `src/pages/Experiences.tsx` | Modifica — widget ore |
| `src/pages/HRDashboard.tsx` | Modifica — fetch budget |
| `src/components/hr/MetricsCards.tsx` | Modifica — card budget |

