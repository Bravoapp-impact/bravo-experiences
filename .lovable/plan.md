## Problema individuato

La foto viene effettivamente rimossa dopo refresh perché il codice elimina prima il file dallo storage. Subito dopo, però, quando prova a eliminare la riga `gallery_photos`, parte ancora un trigger database legacy:

`gallery_photos_storage_cleanup AFTER DELETE -> cleanup_gallery_photo_storage()`

Questa funzione tenta di cancellare direttamente da `storage.objects`, operazione non più consentita. Quindi il frontend mostra l’errore “Direct deletion from storage tables is not allowed”, anche se il file è già stato eliminato tramite Storage API.

In più c’è un warning separato in console su `ModerationQueueDialog` causato da un `useEffect` che aggiorna lo stato a ogni cambio referenziale di `photos`; non è la causa diretta dell’errore di eliminazione, ma può rendere instabile la pagina galleria.

## Piano di intervento

1. **Rimuovere il trigger legacy di cleanup storage**
   - Creare una migrazione che fa `DROP TRIGGER IF EXISTS gallery_photos_storage_cleanup ON public.gallery_photos`.
   - Opzionale ma consigliato: rimuovere anche la funzione `public.cleanup_gallery_photo_storage()` se non è più referenziata.
   - Da questo momento la cancellazione file resta responsabilità del frontend tramite Storage API, come già implementato.

2. **Rendere la cancellazione frontend coerente e immediata**
   - Aggiornare il commento in `useUpdatePhotoStatus.ts`, perché oggi dice ancora che il trigger elimina lo storage.
   - Mantenere il flusso corretto: fetch `storage_path` → `supabase.storage.from("gallery-photos").remove(...)` → delete riga `gallery_photos`.
   - Dopo successo invalidare la query galleria così la foto sparisce subito senza refresh.

3. **Chiudere/aggiornare la lightbox dopo eliminazione**
   - Dopo cancellazione riuscita, chiudere sempre la lightbox o passare alla foto valida successiva solo se necessario.
   - Evitare che rimanga aperta su un elemento già eliminato durante l’invalidazione query.

4. **Correggere il warning di render loop nella moderation queue**
   - Stabilizzare l’effetto di pruning della selezione in `ModerationQueueDialog` usando una dipendenza derivata stabile dagli ID, non l’array `photos` intero.
   - Evitare `setSelected` quando la selezione non cambia davvero.

5. **Verifica**
   - Controllare via query che il trigger legacy non esista più.
   - Verificare che il delete non mostri più l’errore e che la foto sparisca subito dalla UI.
   - Controllare che il warning “Maximum update depth exceeded” non si ripresenti.