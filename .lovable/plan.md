

# Piano: Unificare location_type su experiences e tb_formats

## Panoramica

Aggiungere `location_type` alla tabella `experiences` (come gia esiste in `tb_formats`), rimuovere "Indoor" e "Outdoor" da `AVAILABLE_TAGS`, e aggiornare tutte le UI coinvolte — inclusa la sezione Team Building.

---

## 1 — Migrazione DB

```sql
ALTER TABLE experiences ADD COLUMN location_type text NOT NULL DEFAULT 'both';

-- Migrare dati esistenti dai tag
UPDATE experiences SET location_type = 'indoor'
WHERE secondary_tags @> ARRAY['Indoor'] AND NOT secondary_tags @> ARRAY['Outdoor'];

UPDATE experiences SET location_type = 'outdoor'
WHERE secondary_tags @> ARRAY['Outdoor'] AND NOT secondary_tags @> ARRAY['Indoor'];

UPDATE experiences SET location_type = 'both'
WHERE secondary_tags @> ARRAY['Indoor'] AND secondary_tags @> ARRAY['Outdoor'];

-- Rimuovere Indoor/Outdoor dai tag
UPDATE experiences
SET secondary_tags = array_remove(array_remove(secondary_tags, 'Indoor'), 'Outdoor')
WHERE secondary_tags && ARRAY['Indoor', 'Outdoor'];
```

---

## 2 — Aggiornare `AVAILABLE_TAGS`

**File**: `src/lib/tags.ts`

Rimuovere "Indoor" e "Outdoor". Set finale (13 tag):
Manuale, Creativo, Formativo, Intergenerazionale, Animali, Gruppo, Accessibile, Fisica, Inclusione, Sostenibilita, Cultura locale, Culinario, Sportivo.

**Impatto automatico**: sia `ExperiencesPage` che `TBFormatEditDialog` importano da questo file — i tag Indoor/Outdoor spariranno da entrambi i form senza modifiche aggiuntive.

---

## 3 — Super Admin: Form Experiences

**File**: `src/pages/super-admin/ExperiencesPage.tsx`

- Aggiungere `location_type` al form state (default `"both"`)
- Aggiungere Select "Tipo location" con opzioni Indoor / Outdoor / Entrambi (stesso pattern gia usato in `TBFormatEditDialog`)
- Salvare il campo nel record experience

---

## 4 — Tipo Experience + fetch dettaglio

**File**: `src/types/experiences.ts` — aggiungere `location_type?: string`

**File che fetchano il dettaglio** (aggiungere `location_type` alla select):
- `src/pages/ExperienceDetail.tsx`
- `src/pages/association/AssociationExperienceDetail.tsx`
- `src/pages/hr/HRExperienceDetail.tsx`

---

## 5 — Badge location_type nelle pagine dettaglio

**File**: `src/components/experience-detail/ExperienceDetailContent.tsx`

Aggiungere badge location type nell'header (Indoor / Outdoor / Entrambi) — stesso stile gia usato in `TBFormatDetailPage`.

---

## 6 — Sezione Team Building: gia allineata

La sezione TB **non richiede modifiche funzionali**:
- `TBFormatEditDialog` ha gia il Select `location_type` separato dai tag
- `TBFormatDetailPage` mostra gia il badge location type
- `TBFormatsPage` mostra gia la colonna location type nella tabella

L'unico effetto e che la griglia tag nel dialog di edit non mostrera piu "Indoor" e "Outdoor" (perche rimossi da `AVAILABLE_TAGS`), eliminando la duplicazione che aveva generato la domanda iniziale.

---

## 7 — Form Associazioni

Il form associazioni (`ExperienceForm.tsx`) non gestisce tag secondari ne location_type. Le nuove esperienze create dalle associazioni avranno `location_type = 'both'` (default DB). Il Super Admin potra aggiornarlo. Aggiungere il campo al form associazioni e un task separato futuro.

---

## Riepilogo file

| File | Modifica |
|---|---|
| Migrazione SQL | ADD COLUMN + data migration + tag cleanup |
| `src/lib/tags.ts` | Rimuovere "Indoor" e "Outdoor" |
| `src/types/experiences.ts` | Aggiungere `location_type` |
| `src/pages/super-admin/ExperiencesPage.tsx` | Select location_type nel form |
| `src/components/experience-detail/ExperienceDetailContent.tsx` | Badge location type |
| `src/pages/ExperienceDetail.tsx` | Fetch location_type |
| `src/pages/association/AssociationExperienceDetail.tsx` | Fetch location_type |
| `src/pages/hr/HRExperienceDetail.tsx` | Fetch location_type |

Nessuna modifica a file TB (`TBFormatEditDialog`, `TBFormatDetailPage`, `TBFormatsPage`) — gia allineati.

