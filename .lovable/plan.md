

# Piano: Miglioramento estetico AssociationPublicProfile

## Problemi identificati
1. **Profile card troppo alta** — il LogoUpload si espande inline mostrando preview duplicata + bottone "Cambia" + testo formati, tutto sfasato
2. **Sezione esperienze** usa card con `CardContent` e stile diverso dal catalogo (che usa `ExperienceCardCompact`)
3. **Layout generale** non abbastanza fedele allo stile Airbnb Host

## Modifiche — 1 file: `AssociationPublicProfile.tsx`

### 1. Logo upload — Stile Airbnb
- Eliminare il toggle `showLogoUpload` e il rendering inline di `<LogoUpload>` che crea il problema visivo
- Usare un `<input type="file" hidden>` diretto (come fa LogoUpload internamente) gestito nel componente
- Al click sull'overlay camera → apre direttamente il file picker, fa upload a `association-logos`, aggiorna il DB
- Nessun bottone "Cambia" visibile, nessuna preview duplicata — solo l'avatar cerchio con overlay camera al hover

### 2. Profile card più compatta
- Rimuovere padding eccessivo (da `p-6` a `p-5`)
- Stats: ridurre gap e dimensioni font valori (da `text-lg` a `text-base`)
- Badge verificata: inline sotto le stats, più compatto

### 3. Sezione esperienze — Stesso stile del catalogo
- Sostituire le card custom con lo stile di `ExperienceCardCompact`: immagini quadrate, layout compatto con titolo 13px, città e data in riga
- Non importare `ExperienceCardCompact` direttamente (ha dipendenze da `Experience` type con campi diversi), ma replicare lo stesso stile visivo: `BaseCardImage` aspect-ratio square, niente `Card` wrapper, stile testo identico
- Grid responsive: su mobile mostrare 2 colonne come il catalogo

### 4. Recensioni — Stile più Airbnb
- Rimuovere il `Card` wrapper dalle review, renderizzarle come blocchi semplici con bordo bottom (come Airbnb)
- Avatar + nome sulla prima riga, stelline compatte + data sulla seconda, testo sotto
- Bottone "Mostra altre recensioni" con stile outline e bordo più marcato (come Airbnb)

