## Armonizzazione padding/spacing Galleria HR

### Problemi rilevati

Confrontando con altre pagine HR (`HRExperiencesPage`, `HREmployeesPage`):

- **Doppio padding**: la pagina Galleria usa `p-6 space-y-6`, mentre le altre pagine usano solo `space-y-6` (il padding orizzontale/verticale è già fornito da `HRLayout`). Per questo il titolo appare più in basso e tutto il contenuto è troppo "spinto" verso il centro.
- **Gap eccessivo fra sezioni**: si combinano `space-y-6` (24px) + `PageSection` con `py-6` (48px totali tra header → filtri → galleria).
- **Gap tra foto troppo ampio**: `RowsPhotoAlbum` usa lo spacing di default (~20px). Per uno stile Apple Photos più denso conviene 2–4px.

### Modifiche (`src/pages/hr/HRGalleryPage.tsx`)

1. Container: da `<div className="p-6 space-y-6">` a `<div className="space-y-6">` per allinearsi alle altre pagine HR.
2. Rimuovere il wrapper `<PageSection>` attorno ai filtri (basta un blocco semplice) per evitare doppio padding verticale.
3. Passare `spacing={2}` e `padding={0}` a `RowsPhotoAlbum` per ridurre il gap fra le foto.
4. Stessi accorgimenti anche per lo stato di loading skeleton (ridurre `gap-2` resta ok).

### File toccato

- `src/pages/hr/HRGalleryPage.tsx` (unico file, modifiche puramente di layout/spacing).