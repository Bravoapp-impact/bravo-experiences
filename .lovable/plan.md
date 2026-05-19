# Paginazione "Carica altro" per Galleria

Aggiungiamo un limite di 20 foto visualizzate per volta sia nella galleria HR (`/hr/galleria`) sia nella galleria dipendente (`/gallery`), con un bottone "Carica altro" per mostrarne altre 20 alla volta. I filtri esistenti continuano a funzionare e resettano la paginazione.

## Approccio

Paginazione **client-side** tramite slice dell'array già filtrato. Motivi:
- `useCompanyGallery` (HR) applica già parte dei filtri lato JS (esperienza, associazione) dopo la query — una `.range()` lato DB porterebbe a pagine "bucate".
- `useMyPhotos` (dipendente) restituisce solo le foto dell'utente: volumi contenuti, slice client-side adeguato.
- Nessuna modifica a hook/query/RLS.

Costante condivisa: `GALLERY_PAGE_SIZE = 20` in `src/lib/gallery.ts` (nuovo file, una riga export).

## Galleria HR — `src/pages/hr/HRGalleryPage.tsx`

- Aggiungere stato `visibleCount` (default 20).
- Derivare `visiblePhotos = mainPhotos.slice(0, visibleCount)` e usarlo per la griglia e per il lightbox (paths/index).
- Reset `visibleCount = 20` quando cambiano i filtri rilevanti (tab attivo, ricerca, esperienze, associazioni, date range, onlyFeatured, includeHidden) — via `useEffect` con dipendenze sui filtri.
- "Seleziona tutto" continua a operare solo sulle foto visibili (`visiblePhotos`), coerente con UI mostrata.
- Sotto la griglia: bottone `Carica altro` (variant `outline`, centrato) visibile se `visibleCount < mainPhotos.length`. Testo: `Carica altro (mostrate {visibleCount} di {total})`. Click → `setVisibleCount(c => c + 20)`.

## Galleria dipendente — `src/pages/Gallery.tsx`

- Stesso pattern: `visibleCount` state, slice di `photos`, bottone "Carica altro" se ci sono altre foto.
- Se in futuro verranno aggiunti filtri/tabs lato employee, il reset andrà esteso (per ora la pagina mostra solo "le mie foto" senza filtri).

## Fuori scope

- Nessuna modifica a hook, RLS, edge function, o schema DB.
- Nessuna paginazione server-side / infinite scroll automatico (richiesta esplicita: bottone).
- Nessuna modifica ad aperto.md/log.md (questa è una piccola UX iteration; se vuoi tracciarla esplicitamente, dimmelo e la aggiungo).
