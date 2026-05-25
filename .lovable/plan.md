## Obiettivo
Aggiungere una sezione "Le tue foto" nel `BookingDetailModal` per le esperienze passate/completate, che mostri tutte le foto caricate dal dipendente per quell'evento, con stato di moderazione visibile.

## Modifiche

### 1. Nuovo hook `useMyPhotosForEvent` (`src/hooks/queries/gallery/useMyPhotos.ts`)
Aggiungere accanto a `useMyPhotosCountForEvent` un hook che ritorna la lista completa delle foto dell'utente per uno specifico `experience_date_id`:
- Select: `id, storage_path, status, caption, created_at`
- Filtri: `uploaded_by = userId`, `experience_date_id = ...`
- Tutti gli stati (pending, approved, rejected) — il dipendente vede tutto ciò che ha caricato.
- Ordine: `created_at desc`.
- Riusa una nuova key in `galleryKeys` (es. `myPhotosForEvent`).

### 2. Nuovo componente `MyEventPhotosSection` (`src/components/bookings/MyEventPhotosSection.tsx`)
Componente "presentational" usato dentro `BookingDetailModal`. Props: `experienceDateId`, `onUploadClick?`.
- Usa `useMyPhotosForEvent` + `useSignedPhotoUrls` per ottenere thumbnail.
- Header: titolo "Le tue foto" coerente con gli altri h3 del modal.
- Stati:
  - Loading: piccola skeleton grid.
  - Vuoto: mini empty state con copy invitante ("Non hai ancora caricato foto per questa esperienza") + (se fornito `onUploadClick`) bottone "Carica foto".
  - Con foto: griglia 3–4 colonne di thumbnail quadrate (object-cover, `rounded-lg`). Sopra ogni thumbnail con status diverso da `approved`, badge in overlay:
    - `pending` → "In revisione" (badge `secondary`).
    - `rejected` → "Non approvata" (badge `destructive`).
- Tap su thumbnail: apre `ExperiencePhotosLightbox` (read-only già esistente) — passando le foto dell'utente e gli URL firmati. Non aggiungere delete/edit.

### 3. `BookingDetailModal` (`src/components/bookings/BookingDetailModal.tsx`)
- Renderizzare `<MyEventPhotosSection />` SOLO quando `isPastEvent === true` (la variabile esiste già), posizionata dopo la sezione descrizione e prima del blocco "In caso di imprevisto".
- Aggiungere prop opzionale `onUploadPhotos?: (booking) => void` da passare a `MyEventPhotosSection` come `onUploadClick`, per riusare il `PhotoUploadDialog` già ospitato dalla pagina contenitore.

### 4. `CompletedExperiences.tsx`
- Passare `onUploadPhotos={setUploadDialogBooking}` al `BookingDetailModal` così la sezione vuota può aprire lo stesso `PhotoUploadDialog` esistente (nessun nuovo dialog).
- Nessun'altra modifica.

## Out of scope (non toccare)
- `PhotoUploadDialog` e tutto il flusso di upload/moderazione.
- Pagina Galleria dipendente e bottom nav.
- Pagina Profilo, `MyBookings`, `CompletedExperienceCard`, pagine HR/super-admin/association.
- Schema DB, RLS, edge functions.

## Note tecniche
- Le RLS esistenti su `gallery_photos` ("Employees view own photos and approved gallery") già permettono al dipendente di leggere le proprie foto in qualsiasi stato — nessun cambiamento DB necessario.
- Gli URL firmati vengono generati con `useSignedPhotoUrls` già in uso, bucket `gallery-photos`.
