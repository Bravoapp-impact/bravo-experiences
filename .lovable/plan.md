## Problemi rilevati nella lightbox foto (HR Galleria)

`src/components/hr-gallery/PhotoLightbox.tsx`

1. **Tasto Elimina non funziona visivamente**: l'`AlertDialog` di conferma viene renderizzato con z-index inferiore alla Lightbox (`yet-another-react-lightbox` usa z-index molto alti, ~9999). Il dialog quindi si apre "sotto" la lightbox e diventa visibile solo quando l'utente la chiude — ma in quel momento si chiude da solo perché perde il focus o l'utente clicca fuori.

2. **Tasto Download mal posizionato**: viene renderizzato come `<a>` invece che `<button>`, quindi non eredita correttamente gli stili `.yarl__button` (allineamento verticale, padding) della toolbar.

3. **Tasto Modifica didascalia**: inutile, da rimuovere insieme al relativo `Dialog` e stato `editingCaption`/`captionDraft`.

## Modifiche

**File**: `src/components/hr-gallery/PhotoLightbox.tsx`

1. **Rimuovere il tasto Modifica**:
   - Eliminare l'import `Pencil`, `Dialog*`, `Textarea`, `useUpdatePhotoCaption`
   - Rimuovere `editingCaption`, `captionDraft`, `openCaptionEditor`, `saveCaption`
   - Rimuovere il bottone `caption` dalla `toolbarButtons`
   - Rimuovere il `<Dialog>` di modifica didascalia

2. **Fix tasto Download**:
   - Wrappare l'icona in un `<button>` con `onClick` che apre `signedUrls[current.storage_path]` in nuova tab, OPPURE
   - Mantenere `<a>` ma aggiungere classi di allineamento (`inline-flex items-center justify-center`) per matchare gli altri yarl button.
   - Approccio scelto: mantenere `<a className="yarl__button">` aggiungendo `inline-flex items-center` per garantire centratura dell'icona.

3. **Fix tasto Elimina (AlertDialog sopra la Lightbox)**:
   - Aggiungere `className="z-[10000]"` all'`AlertDialogContent` (e all'overlay tramite portal) per stare sopra la lightbox.
   - Approccio più solido: usare `confirm()` nativo NO — meglio mantenere AlertDialog stilizzato ma forzare z-index alto via className su `AlertDialogContent`. Radix porta sia overlay sia content; lo styling z-index si applica via className che Radix passa al content, mentre per l'overlay possiamo aggiungere uno stile CSS inline o passare un wrapper con `style`.
   - Soluzione pulita: aggiungere a `AlertDialogContent` e implicitamente all'overlay le classi `z-[10000]`. Radix usa `[data-state]` ma applichiamo via Tailwind arbitrary value sul content; l'overlay shadcn `AlertDialogOverlay` ha z-50 di default, quindi va sovrascritto. Modifichiamo il componente solo localmente passando `className` sull'`AlertDialogContent` con `z-[10000]` e, se necessario, importando `AlertDialogOverlay` separatamente per impostare anche il suo z-index.

## Dettagli tecnici

- `yet-another-react-lightbox` usa `--yarl__portal_zindex` (default 9999). Useremo `z-[10001]` per il content del dialog e `z-[10000]` per l'overlay.
- Per controllare z-index dell'overlay shadcn, importiamo `AlertDialogOverlay` e lo renderizziamo esplicitamente prima di `AlertDialogContent` con className custom.

## Fuori scope

- Logica di delete (`useDeletePhoto`) e refresh galleria: nessuna modifica.
- Nessun cambio a `HRGalleryPage.tsx` o altri file.
