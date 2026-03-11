

# Analisi Roadmap v3.0 e Piano di Implementazione Fase 1

## Stato attuale vs. Fase 1

Ho analizzato la roadmap e il codebase. Ecco cosa esiste gia e cosa manca per completare la Fase 1.

### Gia fatto
- Tabella `experience_reviews` + RLS + modal feedback + email post-evento
- Pagina Impact funzionante (booking confirmed + data passata)
- Email transazionali (conferma, reminder)
- Catalogo esperienze con RLS multi-tenant
- Sistema ruoli e tenant isolation

### Da fare per la Fase 1

La roadmap richiede 8 interventi principali. Li ordino per rischio e dipendenze.

---

## Piano di implementazione in 5 Sprint

### Sprint 1 — Colonne additive (rischio zero)
Aggiunte di colonne con DEFAULT che non rompono nulla.

**Database:**
- `experiences`: + `type TEXT DEFAULT 'volunteering'`, + `price_per_participant DECIMAL NULL`, + `visibility TEXT DEFAULT 'public'`, + `created_by UUID NULL`
- `bookings`: + `verified_at TIMESTAMPTZ NULL`, + `verification_method TEXT NULL`, + `verification_data JSONB NULL`
- `profiles`: + `manager_id UUID NULL REFERENCES profiles(id)`
- `companies`: + `max_concurrent_absences INT NULL`
- UPDATE tutte le experiences esistenti con `type = 'volunteering'`

**Rischio:** Nessuno. Sono tutte colonne nullable o con default. Nessuna RLS cambia. L'app continua a funzionare identica.

**Rollback:** `ALTER TABLE ... DROP COLUMN`

### Sprint 2 — Nuove tabelle (rischio basso)
Tabelle nuove che non interferiscono con l'esistente.

**Database:**
- CREATE `company_service_config` (company_id, service_type TEXT, enabled BOOLEAN) + RLS
- CREATE `hour_budgets` (company_id, hours_per_employee_year DECIMAL, fiscal_year_start DATE) + RLS
- INSERT default config `('volunteering', true)` per ogni azienda esistente

**Rischio:** Basso. Tabelle nuove, nessun impatto sull'app finche il frontend non le usa.

**Rollback:** DROP TABLE

### Sprint 3 — Lifecycle booking (rischio medio)
Il booking passa da 2 stati (confirmed/cancelled) a 5 (confirmed/verified/completed/cancelled/no_show).

**Database:**
- Nessun vincolo CHECK sullo status attuale, quindi i nuovi stati sono gia compatibili
- CREATE function `process_completed_events()` che transiziona booking da confirmed a completed per eventi passati di X ore

**Frontend:**
- Aggiornare i filtri in Impact.tsx, MyBookings.tsx e HRDashboard per riconoscere `completed` oltre a `confirmed + data passata`
- Mantenere retrocompatibilita: trattare `confirmed + data passata` come equivalente a `completed` durante la transizione

**Rischio:** Medio. Se il frontend filtra solo per `confirmed`, i booking `completed` spariscono. Servono guard clause.

**Strategia:** Filtrare per `status IN ('confirmed', 'completed')` dove oggi si filtra per `confirmed`. Migrare gradualmente.

**Rollback:** UPDATE bookings SET status = 'confirmed' WHERE status IN ('completed', 'verified')

### Sprint 4 — Borsellino ore + catalogo (rischio medio)
Logica di business nuova che interviene nel flusso di prenotazione.

**Frontend:**
- Verifica ore residue prima della prenotazione (query `hour_budgets` + somma ore `completed`)
- Se budget esaurito, messaggio chiaro e blocco prenotazione
- Se `hour_budgets` non esiste per l'azienda, budget illimitato (retrocompatibilita)
- Dashboard HR: widget ore allocate/utilizzate/residue

**Rischio:** Se il check ore ha bug, puo bloccare le prenotazioni. Serve un flag di bypass.

**Strategia:** Il check e solo frontend. La RLS non blocca la prenotazione per budget ore, quindi in caso di bug basta rimuovere il check dal codice.

### Sprint 5 — "Le mie attivita" + notifica manager (rischio basso)
Nuove pagine e funzionalita che non toccano l'esistente.

**Frontend:**
- Nuova pagina `/app/my-activities` con storico cronologico
- Card "Le mie attivita" nel profilo employee
- Spostamento feedback da modale in MyBookings a pagina dedicata per attivita
- Mantenere il feedback attuale in MyBookings come fallback durante la transizione

**Backend:**
- Edge Function per email informativa al manager alla prenotazione
- Logica tetto assenze contemporanee (check pre-booking)

---

## Regole di sicurezza per ogni Sprint

1. **Mai DROP + CREATE RLS in un singolo step.** Prima aggiungere le nuove policy, verificare, poi rimuovere le vecchie.
2. **Mai ALTER colonne esistenti.** Solo ADD COLUMN. Le colonne vecchie restano finche tutto funziona.
3. **Ogni migrazione e reversibile.** Documentare il rollback SQL prima di eseguire.
4. **Frontend retrocompatibile.** Ogni nuovo stato/campo deve avere un fallback al comportamento attuale.
5. **Test su ambiente Test prima di pubblicare in Live.**

## Nota sulla colonna `company_id` in `experience_dates`

La roadmap dice "DROP company_id da experience_dates". Questo e l'unico punto ad **alto rischio**: oggi tutta la RLS di isolamento multi-tenant per gli employee passa da quel campo. Rimuoverlo richiede riscrivere le RLS policy di `experience_dates`, `bookings`, e il flusso di prenotazione. Propongo di **non farlo nello Sprint 1** ma di pianificarlo come operazione dedicata con test approfonditi.

## Sequenza consigliata

```text
Sprint 1 (colonne)  ──→  Sprint 2 (tabelle)  ──→  Sprint 3 (lifecycle)
                                                         │
                                                         ▼
                                              Sprint 4 (borsellino)  ──→  Sprint 5 (attivita)
```

Sprint 1 e 2 possono essere fatti insieme. Sprint 3 e il prerequisito per 4 e 5.

---

Vuoi che proceda con l'implementazione dello Sprint 1 (colonne additive)?

