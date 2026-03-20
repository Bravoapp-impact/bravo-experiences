

# Piano: Ristrutturazione pannello HR — Home + Sidebar

## File coinvolti

| File | Azione |
|------|--------|
| `src/components/layout/HRLayout.tsx` | Riscrittura sidebar |
| `src/pages/hr/HRHomePage.tsx` | **Nuovo** — Home operativa |
| `src/pages/HRDashboard.tsx` | Nessuna modifica (diventa Report su nuova route) |
| `src/App.tsx` | Nuove route: `/hr` → HRHomePage, `/hr/report` → HRDashboard |

---

## 1. `HRLayout.tsx` — Nuova sidebar

Nuova configurazione sidebarItems con disabled, badge e iconColor:

```
Esplora catalogo → /app/experiences (LayoutGrid, text-slate-500)
--- separatore dopo index 0 ---
Home → /hr (Home, text-violet-500)
[section label "Iniziative" prima di index 3]
Volontariato aziendale → /hr/experiences (Calendar, text-green-500)
Team building sociali → disabled, badge "Presto"
Formazione → disabled, badge "Presto"
Negozio solidale → disabled, badge "Presto"
[section label "Gestione" prima di index 7]
Calendario → disabled, badge "Presto"
Dipendenti → /hr/employees (Users, text-blue-500)
Galleria → disabled, badge "Presto"
Comunicazione → disabled, badge "Presto"
--- separatore dopo index 10 ---
Report → /hr/report (BarChart3, text-rose-500)
Impostazioni → disabled, badge "Presto"
```

Rimuovere `dropdownItems` (Esplora catalogo ora e' in sidebar).

Icone: `Briefcase`, `GraduationCap`, `ShoppingBag`, `CalendarDays`, `Image`, `MessageSquare`, `Settings` per le voci disabled.

## 2. `HRHomePage.tsx` — Nuova Home

Stesso pattern di AssociationHome: contenuto centrato `max-w-4xl mx-auto`, stile Attio.

- **Saluto**: "Buongiorno, {nome utente}" + data odierna in italiano
- **AI textarea**: placeholder "Descrivi il progetto che vuoi realizzare...", send button, chip suggerimenti ("Vedi chi si e' iscritto", "Report impatto", "Prossime iniziative"), toast "coming soon" su invio
- **Azioni rapide**: "Esplora esperienze" → `/hr/experiences`, "Gestisci dipendenti" → `/hr/employees` (entrambi `variant="outline"`)
- **Widget "Prossime iniziative"**: date esperienze aziendali nei prossimi 7 giorni (query experience_dates JOIN experiences JOIN experience_companies con company_id), max 5, con titolo/data/citta/posti confermati. Link "Vedi tutte" → `/hr/report`
- **Widget "Riepilogo rapido"**: 3 metriche compatte (Dipendenti totali, Ore volontariato, Tasso partecipazione) — query leggera da profiles + bookings

## 3. `App.tsx` — Route

- Aggiungere import `HRHomePage`
- Route `/hr` → `<HRHomePage />` (sostituisce HRDashboard)
- Aggiungere route `/hr/report` → `<HRDashboard />`
- HRDashboard resta importato, solo spostato di route

