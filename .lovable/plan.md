

# Piano: Flag "Tutta Italia" per TB Formats

## Panoramica

Aggiungere un campo booleano `nationwide` alla tabella `tb_formats`. Quando attivo, il format è erogabile in tutta Italia e la sezione città nel form viene disabilitata/nascosta. La validazione di pubblicazione considera il flag come alternativa alla presenza di città nella bridge table.

---

## 1 — Migrazione DB

```sql
ALTER TABLE tb_formats
ADD COLUMN nationwide boolean NOT NULL DEFAULT false;
```

Nessuna modifica RLS necessaria (stesse policy esistenti coprono la nuova colonna).

---

## 2 — Interfaccia TBFormat

**File**: `src/components/super-admin/TBFormatEditDialog.tsx`

- Aggiungere `nationwide` all'interfaccia `TBFormat`
- Aggiungere `nationwide` al `formData` state (default `false`)
- Aggiungere un `Checkbox` / `Switch` "Erogabile in tutta Italia" **prima** della griglia delle città
- Quando `nationwide` è attivo:
  - Nascondere la griglia di selezione città
  - Svuotare `selectedCityIds` (opzionale: lasciarli ma ignorarli)
- Nel payload di salvataggio, includere `nationwide`
- Quando `nationwide` è true, **non inserire righe** in `tb_format_cities` (e fare il delete delle eventuali esistenti)

---

## 3 — Validazione pubblicazione

**File**: `src/lib/tb-format-validation.ts`

Aggiungere `nationwide` al tipo del parametro `format`. La regola "Almeno una città" diventa:

```
if (!format.nationwide && cityCount === 0) missing.push("Almeno una città o 'Tutta Italia'");
```

Tutti i punti che chiamano `validateFormatPublish` passano già il format — basta aggiungere il campo.

---

## 4 — Pagina dettaglio

**File**: `src/pages/super-admin/TBFormatDetailPage.tsx`

- Includere `nationwide` nel fetch
- Se `nationwide` è true, mostrare un badge "Tutta Italia" al posto della lista città (es. `Badge` con icona `MapPin` e testo "Disponibile in tutta Italia")

---

## 5 — Pagina lista

**File**: `src/pages/super-admin/TBFormatsPage.tsx`

- Includere `nationwide` nel fetch dei formati
- Nella colonna o nei badge di riga, se `nationwide` è true mostrare "Tutta Italia" invece del conteggio città
- Passare `nationwide` a `validateFormatPublish` nelle azioni rapide

---

## Riepilogo file

| File | Modifica |
|---|---|
| Migrazione SQL | `ADD COLUMN nationwide boolean NOT NULL DEFAULT false` |
| `src/components/super-admin/TBFormatEditDialog.tsx` | Campo nell'interfaccia, switch nel form, logica salvataggio |
| `src/lib/tb-format-validation.ts` | Accettare `nationwide` come alternativa a città |
| `src/pages/super-admin/TBFormatDetailPage.tsx` | Badge "Tutta Italia" nel dettaglio |
| `src/pages/super-admin/TBFormatsPage.tsx` | Indicatore nella lista, passaggio a validazione |

### Nessun impatto su altre pagine
Il flag è specifico dei TB formats e non tocca experiences né altre sezioni.

