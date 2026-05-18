## Galleria HR — gap righe e angoli arrotondati

### Modifiche (`src/pages/hr/HRGalleryPage.tsx`)
1. Ridurre lo `spacing` di `RowsPhotoAlbum` da `4` a `2` (px). Il prop applica sia ai gap orizzontali che verticali fra le righe.
2. Wrappare `<RowsPhotoAlbum>` in un `<div className="overflow-hidden rounded-2xl">` per arrotondare i 4 angoli esterni del container della griglia foto (le foto interne resteranno quadrate/dritte, ma il bordo esterno verrà mascherato dai radius).

Nessuna altra modifica.