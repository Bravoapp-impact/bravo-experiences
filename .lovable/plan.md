# Foto esperienza nel dettaglio dipendente

## Outcome

Nel dettaglio esperienza dipendente (`/app/experiences/:id`), tra Recensioni e Esperienze correlate, appare una sezione "Foto dell'esperienza" con le foto approvate dei colleghi della stessa azienda relative a quella esperienza. Click → lightbox read-only con navigazione. Se zero foto, la sezione non viene renderizzata. HR/super-admin/associazione: nessun cambio.

## DB & Storage

**Verifica storage**: la policy SELECT su `storage.objects` per bucket `gallery-photos` è già `(bucket_id = 'gallery-photos')` per ruolo `authenticated` → qualunque dipendente loggato può generare signed URL. **Nessuna modifica storage necessaria.**

**Migration unica**:

1. Nuova RLS additiva su `public.gallery_photos`:
  ```sql
   CREATE POLICY "Employees view approved company photos for visible gallery"
   ON public.gallery_photos
   FOR SELECT TO authenticated
   USING (
     status = 'approved'
     AND company_id = get_user_company_id(auth.uid())
     AND EXISTS (
       SELECT 1 FROM public.companies c
       WHERE c.id = gallery_photos.company_id
         AND c.gallery_visible_to_employees = true
     )
   );
  ```
   Nome nuovo, additiva: la policy esistente `Employees view own photos and approved gallery` resta intoccata (RLS in OR).
2. Backfill una tantum:
  ```sql
   UPDATE public.companies SET gallery_visible_to_employees = true;
  ```

## Nuovo hook

`src/hooks/queries/gallery/useExperiencePhotosForEmployee.ts`

- Input: `experienceId`
- Disabilitato se `profile.company_id` mancante
- Query: prende prima gli `experience_dates.id` per quell'experience, poi `gallery_photos` con `status='approved'` filtrate `.in('experience_date_id', dateIds)`. Il filtro company + `gallery_visible_to_employees` è garantito dalla RLS.
- Cache standard React Query (staleTime ~5min coerente con altri hook gallery).
- Aggiungere chiave in `gallery/keys.ts`: `experiencePhotos: (experienceId, companyId) => [...all, "experiencePhotos", experienceId, companyId]`.

## Nuovi componenti

`src/components/experience-detail/ExperiencePhotosSection.tsx`

- Riceve `experienceId`.
- Chiama `useExperiencePhotosForEmployee` + `useSignedPhotoUrls` + `useImageDimensions`.
- Render: `RowsPhotoAlbum` (stesso pattern di `Gallery.tsx`/`HRGalleryPage.tsx`).
- Se loading: skeleton compatto. Se `photos.length === 0` o errore: ritorna `null` (la sezione sparisce completamente).
- Titolo "Foto delle esperienze passate" + sottotitolo soft.
- Click foto → apre il nuovo lightbox.

`src/components/experience-detail/ExperiencePhotosLightbox.tsx`

- Wrapper minimale di `yet-another-react-lightbox` con plugin `Captions` e `Zoom`.
- Props: `slides`, `index`, `open`, `onClose`. Nessun delete/edit/download.
- Non riusa `hr-gallery/PhotoLightbox.tsx`.

## Integrazione in `ExperienceDetailContent`

Aggiungere prop opzionale `experiencePhotosSlot?: ReactNode` (stesso pattern di `relatedExperiencesSlot`, `sidebarSlot`). Renderizzata tra `ReviewsSection` e `SdgSection`/`AssociationProfile`/`RelatedExperiences` — concretamente subito dopo il blocco reviews, prima di MeetingPlace? No: la consegna chiede DOPO Recensioni e PRIMA di Esperienze correlate. La struttura attuale è: Reviews → MeetingPlace → UpcomingDates → SDG → Association → Related. Inserire lo slot **subito prima** del blocco `RelatedExperiences` (rispetta letteralmente "dopo Reviews e prima di Related", e non spezza il flusso info-luogo).

Solo `src/pages/ExperienceDetail.tsx` (employee) passa lo slot con `<ExperiencePhotosSection experienceId={experience.id} />`. HR, super-admin, associazione lasciano lo slot `undefined`.

## File toccati

- `supabase/migrations/...` (RLS + backfill)
- `src/hooks/queries/gallery/keys.ts` (nuova chiave)
- `src/hooks/queries/gallery/useExperiencePhotosForEmployee.ts` (nuovo)
- `src/components/experience-detail/ExperiencePhotosSection.tsx` (nuovo)
- `src/components/experience-detail/ExperiencePhotosLightbox.tsx` (nuovo)
- `src/components/experience-detail/ExperienceDetailContent.tsx` (nuovo slot + render)
- `src/pages/ExperienceDetail.tsx` (passa lo slot)

## Fuori scope

Galleria HR e galleria dipendente personali, moderazione, upload, toggle granulare super-admin di `gallery_visible_to_employees`, download/delete dal lightbox, RLS esistenti.