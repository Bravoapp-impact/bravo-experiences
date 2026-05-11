## Problema

Nel dettaglio del format TB (super-admin) il sottotitolo mostra un estratto della descrizione lunga troncato a 180 caratteri, ignorando il campo `short_description` già presente nel DB e nel form di modifica.

Causa: `TBFormatDetailPage.tsx` costruisce l'oggetto `format` da passare a `TBFormatDetailContent` senza includere `short_description`. `TBFormatHeader` ha già la logica corretta (preferisce `shortDescription` se presente, altrimenti tronca `description`), ma riceve sempre `undefined`.

## Modifica

File: `src/pages/super-admin/TBFormatDetailPage.tsx`
- Aggiungere `short_description: formData.short_description` nell'oggetto `format` passato a `<TBFormatDetailContent format={...} />`.

Verificare anche `src/pages/hr/HRTBProposalDetailPage.tsx`: se passa il format senza `short_description`, includerlo per coerenza (solo se il dato è disponibile).

Nessuna modifica DB, nessuna modifica al form di edit, nessuna modifica visiva oltre alla sostituzione del testo nel sottotitolo.

## Comportamento risultante

- Se `short_description` è valorizzata → mostrata sotto il titolo.
- Se vuota → fallback al troncamento della `description` (comportamento attuale).
