

# Redesign: Esperienze raggruppate per stato

## Problema
I badge sovrapposti sull'immagine sono illeggibili. Inoltre, raggruppare per stato rende più chiaro cosa l'utente può fare su ogni esperienza.

## Nuovo layout

La griglia piatta viene sostituita da **sezioni verticali per stato**, mostrate solo se contengono esperienze. Ordine: Bozze → In revisione → Pubblicate → Archiviate.

```text
┌─────────────────────────────────────────────┐
│ Esperienze                [+ Crea esperienza]│
├─────────────────────────────────────────────┤
│ 📄 Bozze (2)               sfondo grigio    │
│ ┌────────┐ ┌────────┐                       │
│ │ IMG    │ │ IMG    │  ← immagine pulita    │
│ │        │ │        │                       │
│ ├────────┤ ├────────┤                       │
│ │ Titolo │ │ Titolo │                       │
│ │ Cat·Città│ │ Cat·Città│                   │
│ │ ✏️ 📤 🗑│ │ ✏️ 📤 🗑│  ← azioni draft    │
│ └────────┘ └────────┘                       │
├─────────────────────────────────────────────┤
│ 🕐 In attesa di approvazione (1)  sfondo amber│
│ ┌────────┐                                  │
│ │ IMG    │  ← card compatta                 │
│ ├────────┤                                  │
│ │ Titolo │  badge "In revisione"            │
│ │ Cat·Città│  nessuna azione                │
│ └────────┘                                  │
├─────────────────────────────────────────────┤
│ ✅ Pubblicate (3)           sfondo verde     │
│ ┌────────┐ ┌────────┐ ┌────────┐           │
│ │ IMG    │ │ IMG    │ │ IMG    │            │
│ ├────────┤ ├────────┤ ├────────┤            │
│ │ Titolo │ │ Titolo │ │ Titolo │            │
│ │ Cat·Città│ │ Cat·Città│ │ Cat·Città│      │
│ │ 👁️     │ │ 👁️     │ │ 👁️     │          │
│ └────────┘ └────────┘ └────────┘            │
├─────────────────────────────────────────────┤
│ ▶ Archiviate (1)  ← collapsible, chiusa    │
│   Titolo esperienza                         │
└─────────────────────────────────────────────┘
```

## Dettagli per sezione

### Header sezione
Ogni sezione ha un header con: icona, titolo, contatore, sfondo leggero tematico (`bg-muted/50` per draft, `bg-amber-50` per pending, `bg-green-50` per published, `bg-muted` per archived). Rounded, padding `px-4 py-2.5`.

### Card (draft, pending_review, published)
- **Immagine pulita** via `BaseCardImage` con `aspectRatio="square"` — nessun badge overlay
- **Sotto l'immagine**: titolo (`text-[13px] font-medium, line-clamp-2`), poi riga con categoria in testo grigio piccolo (`text-[11px] text-muted-foreground`) + città con MapPin
- **Azioni** variano per stato (vedi sotto)

### Azioni per stato
- **draft**: Send (richiedi pubblicazione), Eye (anteprima), Pencil (modifica), Trash2 (elimina) — come ora
- **pending_review**: solo Eye (anteprima), più badge "In revisione" amber inline
- **published**: solo Eye (anteprima)
- **archived**: sezione collapsible (Collapsible di ShadCN), card minime con solo titolo

### Griglia
- `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4` per draft/published
- Stessa griglia per pending_review
- Lista semplice per archived

## Cosa non cambia
- Tutta la logica di stato, fetch, dialogs (create, edit, delete, submit for review), preview modal
- Il pulsante "Crea esperienza" nell'header
- Lo stato vuoto globale (nessuna esperienza in nessuno stato)
- Le animazioni framer-motion

## File modificati

| File | Modifica |
|------|----------|
| `AssociationExperiencesPage.tsx` | Raggruppare esperienze per stato, rimuovere badge overlay, aggiungere sezioni con header tematici, sezione archived collapsible |

