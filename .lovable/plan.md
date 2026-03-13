

# Unify Association Experience Cards to Employee Style

## What changes

Replace the current card layout (16:9 image + Card/CardContent with metadata rows and action bar) with the compact Airbnb-style layout used in the employee catalog, adapted for a grid instead of horizontal scroll.

### Visual structure per card

Following `ExperienceCardCompact` style:
- **Square image** via `BaseCardImage` with `aspectRatio="square"` and `rounded-2xl`
- **Status badge** overlaid on top-left of the image (instead of category badge that employees see)
- **Category badge** on top-right (if present)
- **Title** below image: `text-[13px] font-medium`, `line-clamp-2`
- **City** row: MapPin icon + city name, `text-[11px] text-muted-foreground font-light`
- **Action buttons** row at bottom: same icon buttons (Send, Eye, Pencil, Trash2) with same logic, but smaller (`h-7 w-7`) to match compact style

### Grid layout

Replace the current `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` with a tighter grid that fits more cards:
- `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`

### What stays the same

- All state management, dialogs (create, edit, delete, submit for review), modals
- Status badge logic and colors
- Action button visibility rules (draft-only for edit/delete/submit)
- TooltipProvider wrapping
- Empty state, loading state, page header with "Crea esperienza" button

### File changes

| File | Change |
|------|--------|
| `AssociationExperiencesPage.tsx` | Replace Card-based grid items with compact card layout using `BaseCardImage`, remove `Card`/`CardContent`/`AspectRatio` imports, adjust grid columns |

