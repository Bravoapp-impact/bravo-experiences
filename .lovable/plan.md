## Problema

Nella pagina `HRGalleryPage`, la griglia foto e il lightbox lavorano su due array diversi:

- La griglia (`RowsPhotoAlbum`) riceve `mainAlbum`, che **scarta le foto per cui il signed URL non è ancora arrivato**.
- Il lightbox riceve `mainPhotos`, la lista completa.

Il click ritorna un indice relativo a `mainAlbum`, ma viene usato come indice in `mainPhotos`. Risultato:

- se anche una sola foto manca di signed URL, gli indici si sfasano e si apre una foto sbagliata;
- dopo una cancellazione, la lista del lightbox cambia ma l'indice salvato resta uguale, quindi finisce su una foto diversa o fuori range (non apre nulla).

## Soluzione

Tracciare la selezione **per id della foto, non per indice**, e far lavorare il lightbox sullo stesso identico array che vede la griglia.

### Modifiche in `src/pages/hr/HRGalleryPage.tsx`

1. Sostituire lo stato `lightboxIndex: number | null` con `lightboxPhotoId: string | null`.
2. Costruire una lista derivata `mainPhotosWithUrl` (le foto di `mainPhotos` che hanno un signed URL) — è 1:1 con `mainAlbum`, stesso ordine.
3. `onClick` della griglia: leggere l'`index` ritornato e salvare `mainPhotosWithUrl[index].id` nello stato.
4. Passare al lightbox:
   - `photos={mainPhotosWithUrl}` (stesso array della griglia),
   - `currentIndex={mainPhotosWithUrl.findIndex(p => p.id === lightboxPhotoId)}`,
   - `onIndexChange={(i) => setLightboxPhotoId(mainPhotosWithUrl[i]?.id ?? null)}`,
   - `open` true solo se l'id è ancora presente nella lista (gestisce il caso post-delete: se l'id sparisce, il lightbox si chiude da solo).

### Modifiche in `src/components/hr-gallery/PhotoLightbox.tsx`

Nessuna modifica strutturale necessaria: il componente già funziona per indice. L'unica accortezza: se `photos.length === 0` o l'indice è `-1`, chiudere il lightbox (probabilmente già coperto dal guard `if (!current) return null`, ma vale la pena chiamare `onOpenChange(false)` quando l'id selezionato non esiste più, già gestito al punto 4 sopra dal parent).

## Cosa NON cambia

- Logica di cancellazione (già corretta nel turno precedente: rimozione via Storage API + delete riga DB).
- RLS, hook query, `useCompanyGallery`, `useSignedPhotoUrls`.
- Layout, spaziature, stili.

## Verifica

1. Click su una foto qualsiasi → si apre **quella** foto nel lightbox, anche se altre foto non hanno ancora signed URL.
2. Naviga avanti/indietro nel lightbox → l'id selezionato si aggiorna.
3. Elimina la foto corrente → il lightbox si chiude automaticamente (id non più presente), la griglia si aggiorna.
4. Riapri un'altra foto → si apre quella corretta.
