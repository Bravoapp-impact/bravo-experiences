

# Piano: Completamento Catalogo TB + Allineamento Doc

## Panoramica

Tre interventi sul codice + aggiornamento del documento `tb-flow.md` per allinearlo allo stato attuale.

---

## 1 — Gestione servizi inclusi/extra nel dialog di edit

**File**: `src/components/super-admin/TBFormatEditDialog.tsx`

Aggiungere due sezioni al form, dopo il campo "Prezzo max":

- **Servizi inclusi** — lista dinamica di stringhe. Input testuale + pulsante "Aggiungi". Ogni servizio aggiunto appare come chip con X per rimuoverlo. Salvataggio come `services: { items: ["stringa1", "stringa2"] }` (struttura JSONB documentata nel doc).
- **Servizi extra** — stessa UX. Salvataggio come `extra_services: { items: [...] }`.

Al caricamento del form in edit, parsare i JSONB esistenti per popolare le liste. Nel payload di salvataggio, includere `services` e `extra_services`.

**File**: `src/pages/super-admin/TBFormatDetailPage.tsx`

Aggiungere due sezioni nel contenuto principale (dopo SDGs, prima di Citta):
- "Servizi inclusi" — lista con icona CheckCircle
- "Servizi extra" — lista con icona PlusCircle

Visibili solo se il rispettivo array ha almeno un elemento.

---

## 2 — Validazione pubblicazione format incompleti

**Regole** (dal doc sezione 3.1, righe 70-78):
- `title` non vuoto
- `category_id` valorizzato
- `participants_min` e `participants_max` entrambi valorizzati
- `price_range_min` e `price_range_max` entrambi valorizzati
- almeno una citta in `tb_format_cities`
- almeno un'ETS in `tb_format_associations`

**Dove applicare:**

1. **`TBFormatEditDialog`** — quando `formData.status` e `"published"`, al click di "Salva" verificare tutti i requisiti. Se non soddisfatti, mostrare toast con elenco dei campi mancanti e bloccare il salvataggio. Se lo stato e `"draft"` o `"archived"`, nessuna validazione extra (solo titolo obbligatorio come gia presente).

2. **`TBFormatDetailPage`** sidebar — il pulsante "Pubblica" deve verificare gli stessi requisiti prima di chiamare `handleStatusChange`. Se non soddisfatti, toast con elenco mancanze.

3. **`TBFormatsPage`** — le azioni rapide (punto 3) applicheranno la stessa validazione.

Estrarre la logica di validazione in una funzione condivisa (o inline, dato che e semplice) che riceve il format + cityIds + associationIds e ritorna `{ valid: boolean; missing: string[] }`.

---

## 3 — Azioni rapide di cambio stato dalla lista

**File**: `src/pages/super-admin/TBFormatsPage.tsx`

Nella colonna "Azioni" di ogni riga, aggiungere un pulsante contestuale:
- Se `draft` → icona Play/Send + "Pubblica" (con validazione: richiede fetch dei junction data per quel format)
- Se `published` → icona Archive + "Archivia"
- Se `archived` → icona RotateCcw + "Riattiva come bozza"

Per la validazione della pubblicazione dalla lista, al click di "Pubblica" fare un fetch rapido di `tb_format_cities` e `tb_format_associations` per quel format, poi applicare la stessa logica di validazione del punto 2. Se passa, aggiornare lo stato; altrimenti toast con mancanze.

---

## 4 — Aggiornamento `docs/tb-flow.md`

Correzioni da applicare:

| Riga | Problema | Fix |
|---|---|---|
| 92 | `activity_type` su `tb_requests` — colonna inesistente | Rimuovere la riga o sostituire con nota che il tipo attivita non e un campo dedicato |
| 331 | Route `/admin/team-building/formats` | Gia corretto in A.5, ma il corpo del doc (sezione 6.2) usa ancora `/admin/...` — uniformare a `/super-admin/...` |
| 460-463 | A.1 elenca ancora "Outdoor, Indoor" nei tag | Rimuovere, aggiungere nota che Indoor/Outdoor sono gestiti dal campo `location_type` |

Aggiungere nuova appendice **A.8**:
> **A.8 Unificazione `location_type`**
> Il campo `location_type` (enum: `indoor`, `outdoor`, `both`) e stato aggiunto anche alla tabella `experiences`, sostituendo i tag "Indoor" e "Outdoor" che sono stati rimossi da `AVAILABLE_TAGS`. La sorgente di verita per il set di tag ora contiene 13 voci tematiche, senza i valori di location.

---

## Riepilogo file

| File | Modifica |
|---|---|
| `src/components/super-admin/TBFormatEditDialog.tsx` | Sezioni servizi inclusi/extra + validazione pubblicazione |
| `src/pages/super-admin/TBFormatDetailPage.tsx` | Sezioni servizi nel dettaglio + validazione pulsante Pubblica |
| `src/pages/super-admin/TBFormatsPage.tsx` | Azioni rapide cambio stato con validazione |
| `docs/tb-flow.md` | Correzione activity_type, route, tag set, nuova appendice A.8 |

### Nessuna migrazione DB
Tutte le colonne esistono gia. La struttura JSONB `{ items: [...] }` e gia documentata nel doc.

