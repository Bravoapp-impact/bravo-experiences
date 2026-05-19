## Obiettivo

Permettere all'HR, nella pagina `/hr/galleria`, di selezionare più foto e poi:
- scaricarle in un unico file `.zip`
- eliminarle in blocco

Comportamento desktop e mobile coerente con l'attuale stile minimal Airbnb-like.

## UX

1. **Attivazione "modalità selezione"**
   - In alto a destra della griglia, accanto ai filtri, un pulsante "Seleziona".
   - Cliccandolo, la griglia entra in modalità selezione: ogni foto mostra una checkbox in overlay (in alto a sinistra). Il click sulla foto in modalità selezione seleziona/deseleziona invece di aprire la lightbox.
   - In modalità selezione la lightbox è disabilitata (per evitare conflitti col tap su mobile).

2. **Action bar di selezione**
   - Appare una barra sticky in cima alla griglia (sotto i filtri) quando c'è almeno 1 selezione, con:
     - Conteggio "N foto selezionate"
     - Link "Seleziona tutto" / "Deseleziona tutto" (riferito ai risultati filtrati attualmente visibili)
     - Pulsante "Scarica ZIP" (con spinner durante la generazione)
     - Pulsante "Elimina" (destructive)
     - Pulsante "Esci dalla selezione"

3. **Conferme**
   - Eliminazione: AlertDialog di conferma ("Eliminare N foto? Operazione irreversibile.").
   - Download: feedback toast con progresso ("Sto preparando lo ZIP… N/M").

4. **Mobile**
   - L'action bar diventa una barra sticky in basso con i due CTA principali (Scarica, Elimina) e il conteggio + chiudi a sinistra.

## Tecnico

### Dipendenze
- Aggiungere `jszip` per generare il file ZIP lato client (i bucket non sono pubblici, quindi serve fetchare i blob via signed URL e zipparli nel browser).
- Nessuna libreria di salvataggio extra: usiamo un `<a download>` con `URL.createObjectURL(blob)`.

### Stato in `HRGalleryPage.tsx`
- `selectionMode: boolean`
- `selectedIds: Set<string>`
- Quando `selectionMode` cambia o cambiano i filtri, resettare `selectedIds`.
- Helper `toggle(id)`, `selectAllVisible()`, `clearSelection()`, `exitSelectionMode()`.

### Griglia
- `RowsPhotoAlbum` non offre overlay UI di selezione → wrappiamo ogni immagine custom tramite `render.image` o `render.photo` (l'API di `react-photo-album` lo supporta). In alternativa, in modalità selezione passiamo `onClick` che invece di aprire la lightbox chiama `toggle(id)`, e renderizziamo un overlay checkbox come elemento posizionato assoluto sopra ogni cella (tramite `render.extras`).
- Stile selezionato: ring `primary` + leggera opacità sul resto.

### Bulk download (ZIP)
- Nuovo hook `useBulkDownloadPhotos(companyId)`:
  1. Riceve array di `photo` (id + storage_path + nome esperienza + data per il filename).
  2. Per ogni foto, scarica il blob via `fetch(signedUrl)` (gli URL firmati per il bucket privato vengono già generati da `useSignedPhotoUrls`; per il download di tutte le selezionate, se manca, generiamo on-demand chiamando `supabase.storage.from("gallery-photos").createSignedUrls(paths, 3600)`).
  3. Costruisce filename leggibili tipo `Esperienza_2025-05-12_001.jpg` (sanificati), con suffisso numerico in caso di collisione.
  4. Aggiunge al `JSZip` e genera `blob` tipo `application/zip`.
  5. Trigger download: `a.href = URL.createObjectURL(blob); a.download = "galleria-${companyName||'foto'}-${yyyymmdd}.zip"; a.click(); URL.revokeObjectURL`.
  6. Limiti: max 200 foto per ZIP (mostra toast d'errore se sforato) per evitare OOM su mobile; mostriamo progresso con `toast.loading` aggiornato.

### Bulk delete
- Nuovo hook `useBulkDeletePhotos(companyId)` basato sulla logica già presente in `useDeletePhoto`:
  - Per ogni foto: chiamata `supabase.storage.from("gallery-photos").remove([...paths])` in un'unica call con max 1000 path.
  - Poi `supabase.from("gallery_photos").delete().in("id", ids)`.
  - Una sola `invalidateQueries(galleryKeys.companyAll(companyId))` alla fine.
- Errori parziali: se la `remove` storage fallisce per alcuni file, registriamo warning ma procediamo col delete DB (il trigger legacy non c'è più, e l'orfano sullo storage è meno grave del file fantasma in galleria).

### File toccati / nuovi
- `src/pages/hr/HRGalleryPage.tsx` — stato selezione, action bar, props alla griglia.
- `src/components/hr-gallery/GallerySelectionBar.tsx` (nuovo) — UI della barra azioni.
- `src/components/hr-gallery/PhotoGrid.tsx` — opzionale, estrarre la `RowsPhotoAlbum` se serve `render.extras` con overlay checkbox; altrimenti inline.
- `src/hooks/queries/gallery/useBulkDeletePhotos.ts` (nuovo).
- `src/hooks/queries/gallery/useBulkDownloadPhotos.ts` (nuovo).
- `package.json` — aggiungere `jszip`.

## Fuori scope
- Selezione cross-pagina o cross-filtro: la selezione vive sui risultati attualmente filtrati e si azzera al cambio filtri.
- Bulk approve/reject in galleria principale (già coperto dalla coda di moderazione).
- Export ZIP server-side via edge function (valutabile in futuro se i volumi crescono).