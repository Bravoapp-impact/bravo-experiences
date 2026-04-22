

# Piano: Preparazione e Step 1 — Fondamenta Team Building

## Panoramica

Tre azioni preparatorie + la migrazione DB fondamentale. Tutto in un unico deploy, zero impatto sulla UI esistente.

---

## Azione 0a — Salvare docs

- Copiare `Business_Model_v4.md` in `docs/business-model.md`
- Aggiornare `docs/tb-flow.md` con le decisioni emerse (punti 1-6 dalla conversazione)

## Azione 0b — Unificare i tag secondari

I tag secondari attuali (`AVAILABLE_TAGS` in `ExperiencesPage.tsx`) coprono quasi tutti i casi. Dal CSV mancano solo:

| Tag CSV | Tag attuale corrispondente | Azione |
|---|---|---|
| FoodCooking | — | Aggiungere **"Culinario"** |
| SportAdventure | "Fisica" (parziale) | Aggiungere **"Sportivo"** (Fisica resta per attivita fisica generica) |
| Social | "Inclusione" | Gia coperto |

**Set unificato finale** (usato da experiences e tb_formats):
`Outdoor, Indoor, Manuale, Creativo, Formativo, Intergenerazionale, Animali, Gruppo, Accessibile, Fisica, Inclusione, Sostenibilita, Cultura locale, Culinario, Sportivo`

Nessun enum DB — restano come array di stringhe (`text[]`), con la costante `AVAILABLE_TAGS` estratta in un file condiviso (`src/lib/tags.ts`) e importata sia da `ExperiencesPage` che dalle future pagine TB.

## Azione 0c — Rimuovere `company_service_config`

Il business model dice che la subscription da accesso a tutto. Il gating per servizio non serve piu.

**Impatto reale** — solo 2 RLS policies da aggiornare:
1. `HR admin can view published public experiences v2` — rimuovere il JOIN su `company_service_config`, lasciare solo il check `status = 'published' AND visibility = 'public'`
2. Stessa logica nella policy gemella

**Migrazione SQL**:
- DROP delle 2 policies esistenti
- Ricreazione senza il JOIN su `company_service_config`
- DROP della tabella `company_service_config` (e trigger associato)
- DROP del tipo se presente

Nessun codice applicativo da modificare (zero riferimenti nel frontend).

---

## Step 1 — Migrazione DB: tabelle core TB + `user_events`

### Tabelle da creare

**`secondary_tags`** (lookup opzionale)
Non necessaria: i tag restano come array `text[]`. La costante TypeScript e la sorgente di verita.

**`user_events`** — analytics trasversale
```
id, user_id, event_type (text), event_data (jsonb), created_at
```
RLS: INSERT per authenticated, SELECT per super_admin e proprio user.

**`tb_formats`** — catalogo format TB
```
id, title, description, image_url, category_id (FK categories),
secondary_tags (text[]), location_type (enum: indoor/outdoor/both),
participants_min, participants_max, duration_hours,
price_range_min, price_range_max,
sdgs (text[]), status (text: draft/published/archived),
services (jsonb), extra_services (jsonb),
created_at, updated_at
```

**`tb_format_associations`** — ponte format ↔ ETS erogatori
```
id, format_id (FK tb_formats), association_id (FK associations), created_at
```

**`tb_format_cities`** — ponte format ↔ citta
```
id, format_id (FK tb_formats), city_id (FK cities), created_at
```

**`tb_requests`** — richieste HR
```
id, company_id (FK companies), requested_by (uuid),
title, description, participants_count, preferred_date,
preferred_location_type, preferred_city_id,
budget_indication, status (text, 14 stati del doc),
assigned_admin_id (uuid), internal_notes,
created_at, updated_at
```

**`tb_proposals`** — schede "Best Ideas"
```
id, request_id (FK tb_requests), format_id (FK tb_formats),
association_id (FK associations),
custom_title, custom_description, custom_image_url,
price_proposal, client_status (text: pending/interested/needs_clarification/declined),
client_notes, admin_notes, sort_order,
created_at, updated_at
```

**`tb_quotes`** — preventivi
```
id, request_id (FK tb_requests), version (int default 1),
status (text: draft/sent/viewed/accepted/rejected/modification_requested/superseded),
total_final, total_ets, margin_amount, margin_percent,
valid_until, notes, sent_at,
created_at, updated_at
```

**`tb_quote_items`** — righe preventivo
```
id, quote_id (FK tb_quotes),
description, quantity, unit_price_ets, unit_price_final,
total_ets, total_final, sort_order,
created_at
```

**`tb_matching_decisions`** — log per futuro AI
```
id, request_id, format_id, association_id,
decision_type (text: shown_in_filter/selected_as_proposal/discarded/client_interested/client_declined),
reason, decided_by (uuid),
created_at
```

**`tb_contracts`** — firma (V1 manuale)
```
id, request_id (FK tb_requests), quote_id (FK tb_quotes),
signature_method (text: manual_external/click_in_app),
signed_at, pdf_url, notes,
created_at
```

**`tb_events`** — evento post-vendita
```
id, request_id (FK tb_requests), contract_id (FK tb_contracts),
title, event_date, location, status (text: pending_date/date_confirmed/in_progress/completed),
public_slug (unique), max_participants,
created_at, updated_at
```

**`tb_event_participants`** — iscrizioni (punto aperto: URL pubblico vs employee)
```
id, event_id (FK tb_events), user_id (uuid nullable),
first_name, last_name, email,
dietary_restrictions, privacy_accepted,
created_at
```

### RLS policies

- **Super admin**: full access su tutte le tabelle `tb_*` e `user_events`
- **HR admin**: SELECT/INSERT su `tb_requests` filtrato per `company_id = get_user_company_id(auth.uid())`. SELECT su `tb_proposals`, `tb_quotes`, `tb_quote_items`, `tb_contracts`, `tb_events` collegati alle proprie requests
- **`user_events`**: INSERT per authenticated, SELECT per super_admin + proprio user

### Route

Tutte le route TB seguiranno il pattern esistente:
- `/super-admin/team-building/...`
- `/hr/team-building/...`

---

## Dettaglio tecnico

### File modificati
| File | Modifica |
|---|---|
| `docs/business-model.md` | Nuovo — copia del documento |
| `docs/tb-flow.md` | Aggiornato con decisioni |
| `src/lib/tags.ts` | Nuovo — costante `AVAILABLE_TAGS` unificata |
| `src/pages/super-admin/ExperiencesPage.tsx` | Import da `src/lib/tags.ts` invece di costante locale |

### Migrazioni SQL (in ordine)
1. Rimozione `company_service_config` + aggiornamento 2 RLS policies su `experiences`
2. Creazione tabelle `tb_*`, `user_events`, enums, RLS policies, trigger `updated_at`

### Rischi
- La rimozione di `company_service_config` rende visibili a HR admin tutte le esperienze pubblicate, indipendentemente dal tipo. Questo e coerente col business model (subscription = accesso a tutto).
- Nessun impatto sulla UI: le tabelle TB sono vuote, nessuna pagina le referenzia ancora.

