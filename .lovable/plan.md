## Pianificazione: Semplificazione Galleria HR

### Obiettivo
Ridurre la superficie di funzionalità della galleria HR togliendo controlli avanzati (evidenziazione, nascondimento, filtro enti) per semplificare l'interfaccia.

### Modifiche previste

#### 1. Filtri (`src/components/hr-gallery/GalleryFilters.tsx`)
- Rimuovere il filtro multi-select **"Enti partner"** (prop `associationOptions` e relativo componente `MultiSelectFilter`).
- Rimuovere lo switch **"Solo in evidenza"**.
- Rimuovere lo switch **"Mostra nascoste"**.
- Aggiornare `GalleryFiltersState` e `EMPTY_FILTERS` di conseguenza (campi `associationIds`, `onlyFeatured`, `includeHidden`).

#### 2. Pagina Galleria (`src/pages/hr/HRGalleryPage.tsx`)
- Rimuovere il calcolo di `associationOptions` (non più necessario).
- Rimuovere la sezione **"In evidenza"** (sezione con le foto `is_featured` e titolo con stella).
- Aggiornare la query `useCompanyGallery` per non passare più `onlyFeatured`, `includeHidden`, `associationIds`.
- La query `allPhotos` per le opzioni esperienza resta senza `includeHidden`.

#### 3. Lightbox Azioni (`src/components/hr-gallery/PhotoLightbox.tsx`)
- Rimuovere i pulsanti toolbar:
  - **Metti in evidenza** (stella)
  - **Nascondi / Rendi visibile** (occhio)
- Mantenere: didascalia, download, elimina.
- Rimuovere gli hook e le funzioni correlate (`useTogglePhotoFeatured`, `useUpdatePhotoStatus`, stati e handler per hide/show/featured).

### File coinvolti
- `src/components/hr-gallery/GalleryFilters.tsx`
- `src/pages/hr/HRGalleryPage.tsx`
- `src/components/hr-gallery/PhotoLightbox.tsx`

### Hook da dismettere (cleanup opzionale)
- `useTogglePhotoFeatured` e `useUpdatePhotoStatus` non saranno più usati dalla galleria HR. Rimangono in codebase ma inutilizzati per questo flusso.