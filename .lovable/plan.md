

# Step 2 (rivisto) — Super Admin: Catalogo TB Formats

## Panoramica

Invece di una singola pagina CRUD con dialog, creiamo **due pagine** che seguono lo stesso pattern delle experiences:

1. **Lista** (`/super-admin/team-building/formats`) — tabella con filtri, ricerca, azioni
2. **Dettaglio** (`/super-admin/team-building/formats/:id`) — layout stile ExperienceDetail (hero image, sezioni informative, sidebar con azioni admin)

Il form di edit viene aperto come **dialog** dalla pagina di dettaglio (stesso pattern di `AssociationExperienceDetail` che apre `CreateExperienceDialog` per l'editing).

---

## 2.1 — Sidebar: aggiungere sezione Team Building

**File**: `src/components/layout/SuperAdminLayout.tsx`

Aggiungere una nuova sezione "Team Building" con:
- "Catalogo TB" → `/super-admin/team-building/formats` (icona: `LayoutGrid`)

Nuovo `sectionLabel` con `label: "Team Building"` prima dell'indice corretto.

---

## 2.2 — Pagina Lista `TBFormatsPage`

**File**: `src/pages/super-admin/TBFormatsPage.tsx`

Pattern identico a `ExperiencesPage` ma semplificato (no date, no visibility):

- **Tabella** con colonne: Immagine thumbnail + Titolo, Categoria, Location type, Range partecipanti, Stato, Azioni
- **Filtri**: ricerca testuale + stato (draft/published/archived) + categoria
- **Azioni riga**: Modifica (apre dialog), Dettaglio (naviga a `/super-admin/team-building/formats/:id`), Elimina
- **CTA "Nuovo format"** in alto a destra: apre dialog di creazione
- **Dialog creazione/modifica** con tutti i campi (stessi del piano precedente: titolo, descrizione, immagine, categoria, tag, SDGs, location type, partecipanti, durata, prezzo, stato, citta multi-select, associazioni multi-select)

Lookup da caricare: `categories`, `cities`, `associations`.

---

## 2.3 — Pagina Dettaglio `TBFormatDetailPage`

**File**: `src/pages/super-admin/TBFormatDetailPage.tsx`

Layout ispirato a `ExperienceDetailContent` ma adattato ai campi di `tb_formats`:

### Hero split-screen (come ExperienceDetail)
- **Sinistra**: immagine hero del format
- **Destra**: titolo, categoria (badge), location type (badge Indoor/Outdoor/Entrambi), range partecipanti, durata, range prezzo, stato (badge colorato)

### Colonna principale (sezioni con Separator)
- **Descrizione** — "Cosa farete" (come WhatYouWillDo)
- **Tag secondari** — badge grid (come TagsSection)
- **SDGs** — griglia SDG (come SdgSection)
- **Servizi inclusi / Extra** — lista da `services` e `extra_services` JSONB
- **Citta disponibili** — lista delle citta collegate (da `tb_format_cities` + join `cities`)
- **Associazioni erogabili** — lista delle ETS collegate (da `tb_format_associations` + join `associations`, con logo e nome)

### Sidebar destra (sticky, come HRSidebar/AssociationDetailSidebar)
- Pulsante "Modifica" → apre dialog di edit (riusa lo stesso dialog della lista)
- Pulsante "Pubblica" / "Archivia" (cambio stato rapido)
- Pulsante "Elimina" con conferma
- Info rapide: data creazione, ultimo aggiornamento

### Navigazione
- Freccia indietro → torna alla lista
- Badge stato in alto accanto al titolo (come AssociationExperienceDetail)

---

## 2.4 — Componente condiviso: `TBFormatEditDialog`

**File**: `src/components/super-admin/TBFormatEditDialog.tsx`

Dialog di creazione/modifica estratto come componente separato, usato sia dalla lista che dal dettaglio. Stessa struttura del dialog in ExperiencesPage ma con i campi di tb_formats.

Gestisce il salvataggio del record principale + tabelle ponte (`tb_format_cities`, `tb_format_associations`) con strategia delete + re-insert.

---

## 2.5 — Route in App.tsx

Aggiungere:
- `/super-admin/team-building/formats` → `TBFormatsPage`
- `/super-admin/team-building/formats/:id` → `TBFormatDetailPage`

Entrambe protette da `ProtectedSuperAdminRoute`.

---

## Dettaglio tecnico

### File da creare
| File | Descrizione |
|---|---|
| `src/pages/super-admin/TBFormatsPage.tsx` | Lista + dialog di creazione |
| `src/pages/super-admin/TBFormatDetailPage.tsx` | Dettaglio format stile ExperienceDetail |
| `src/components/super-admin/TBFormatEditDialog.tsx` | Dialog edit condiviso |

### File da modificare
| File | Modifica |
|---|---|
| `src/components/layout/SuperAdminLayout.tsx` | Voce sidebar "Catalogo TB" |
| `src/App.tsx` | 2 nuove route |

### Nessuna migrazione DB
Tutte le tabelle esistono gia dallo Step 1.

### Pattern riutilizzati
- Layout hero split-screen da `ExperienceDetailContent`
- Sezioni con `Separator` + `motion.div` animate
- `TagsSection` e `SdgSection` riutilizzabili direttamente (ricevono array di stringhe)
- `LogoUpload` per immagine
- `AVAILABLE_TAGS` da `src/lib/tags.ts`
- `getAllSDGs()` da `src/lib/sdg-data.ts`
- `PageHeader` per la lista
- Badge stato con stesso pattern colori di ExperiencesPage

### Complessita
- Il dialog di edit gestisce 2 tabelle ponte oltre al record principale
- La pagina dettaglio fa un fetch con join su `categories`, `cities` (via `tb_format_cities`), `associations` (via `tb_format_associations`)
- Nessun impatto sulle pagine esistenti

