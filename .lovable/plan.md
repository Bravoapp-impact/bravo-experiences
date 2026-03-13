

# Modifica esperienze draft + azioni card con tooltip

## Cosa fare

### 1. Estrarre `ExperienceForm` come componente condiviso
Estrarre il form attualmente dentro `CreateExperienceDialog` in un componente `ExperienceForm` riusabile che:
- Accetti una prop opzionale `experience` per pre-popolare i campi (modalità edit)
- Accetti `onSubmit(data)` callback
- Gestisca internamente stato form, validazione, upload immagine
- NON gestisca la modale — quella resta responsabilità del componente padre

### 2. Refactorare `CreateExperienceDialog`
- Usa `ExperienceForm` internamente
- In modalità create: `onSubmit` fa INSERT
- In modalità edit: `onSubmit` fa UPDATE (stessa experience passata come prop)
- Rinominare in `ExperienceFormDialog` e accettare prop `experience?: Experience`
- Titolo modale dinamico: "Nuova esperienza" vs "Modifica esperienza"
- Testo bottone dinamico: "Crea esperienza" vs "Salva modifiche"
- Toast dinamico: "Esperienza creata come bozza" vs "Modifiche salvate"
- L'UPDATE sincronizza i campi legacy `category`, `city` come nella creazione

### 3. Azioni card con icon buttons + tooltip
Sostituire il pulsante "Visualizza dettagli" con una barra di azioni:

```text
┌──────────────────────────────────────┐
│  [👁 Anteprima]  [✏ Modifica]  [🗑]  │
└──────────────────────────────────────┘
```

- **Anteprima** (Eye): sempre visibile, apre modale dettaglio (come prima)
- **Modifica** (Pencil): visibile solo per `status === "draft"`, apre `ExperienceFormDialog` in edit mode
- **Elimina** (Trash): visibile solo per `status === "draft"` (per ora; in futuro verificherà iscritti)

Ogni icona è un `Button variant="ghost" size="icon"` wrappato in un `Tooltip` (ShadCN) che mostra la label al hover.

### 4. Eliminazione bozza
Aggiungere icona cestino per le bozze. Click apre conferma (dialog semplice o toast di conferma). DELETE via Supabase. RLS per DELETE da association_admin è già attiva.

## File coinvolti

| File | Modifica |
|------|----------|
| `src/components/association/ExperienceForm.tsx` | **NUOVO** — form estratto |
| `src/components/association/CreateExperienceDialog.tsx` | Refactor → usa `ExperienceForm`, supporta create/edit |
| `src/pages/association/AssociationExperiencesPage.tsx` | Icon buttons con tooltip, stato per edit/delete, `ExperienceFormDialog` in edit mode |

## Dettagli implementativi

**ExperienceForm props:**
```typescript
interface ExperienceFormProps {
  experience?: Experience; // se presente → edit mode
  onSubmit: (data: ExperienceFormData) => Promise<void>;
  saving: boolean;
  submitLabel: string;
}
```

**Update query (edit mode):**
```typescript
await supabase.from("experiences")
  .update({
    title, description, category_id, category: categoryName,
    city_id, city: cityName, address, participant_info, image_url
  })
  .eq("id", experience.id);
```

**Card actions (tooltip icon buttons):**
```tsx
<div className="flex items-center justify-end gap-1">
  <Tooltip><TooltipTrigger asChild>
    <Button variant="ghost" size="icon" onClick={...}>
      <Eye className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Anteprima</TooltipContent></Tooltip>
  
  {experience.status === "draft" && (
    <>
      <Tooltip>...Modifica...</Tooltip>
      <Tooltip>...Elimina...</Tooltip>
    </>
  )}
</div>
```

**Eliminazione bozza:**
- Click su cestino → `DeleteConfirmDialog` (già esistente nel progetto in `src/components/crud/DeleteConfirmDialog.tsx`)
- Conferma → `supabase.from("experiences").delete().eq("id", id)`
- Toast "Esperienza eliminata" + refresh lista

