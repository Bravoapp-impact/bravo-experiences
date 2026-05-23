## Obiettivo
Aggiornare `docs/log.md` con le entry delle modifiche UI implementate oggi.

## Modifiche da documentare

### Entry 1 — Ristrutturazione pagina Profilo dipendente
- Card identità hero con avatar editabile, nome e azienda (unica vera Card della pagina).
- Due tile affiancate stile Airbnb sotto la card: "Esperienze completate" (→ `/app/esperienze-completate`) e "Ore donate" (→ `/app/impact`), con icone colorate senza sfondo e numero di fianco.
- Flat row budget ore con Progress.
- Flat row Impostazioni + bottone logout.
- Rimozione anteprima inline esperienze completate, rimozione CompletedExperienceCard/FeedbackModal/BookingDetailModal da Profile.tsx.
- Titolo e sottotitolo della pagina resi coerenti.

**File toccati:** `src/pages/Profile.tsx`

### Entry 2 — Trasloco storico: foto upload e riduzione MyBookings
- Aggiunta azione "Aggiungi le tue foto" su `CompletedExperienceCard` (sempre visibile, indipendente dallo stato recensione).
- `CompletedExperiences.tsx` ora ospita `PhotoUploadDialog` e lo gestisce al tap sull'azione foto.
- `MyBookings.tsx` ridotta a pura vista operativa delle esperienze future: rimossa interamente la sezione "Storico" (accordion, AnimatePresence, past bookings, FeedbackModal, PhotoUploadDialog), rimossi stati e import correlati. Ora mostra solo `futureBookings` (`confirmed` e non passate). Empty state aggiornato.

**File toccati:** `src/components/experiences/CompletedExperienceCard.tsx`, `src/pages/CompletedExperiences.tsx`, `src/pages/MyBookings.tsx`

## Cosa NON cambia
- Nessuna modifica a DB, RLS, RPC, edge function.
- Nessuna modifica a `/app/esperienze-completate` (salvo ospitare il dialog), `/app/impact`, bottom nav, pagine admin, logica redirect ruoli.

## Azione
Compilare il template entry in cima a `docs/log.md` (sezione Entries) con i due gruppi di modifiche — possono stare in un'unica entry "sessione di lavoro" oppure in due entry separate se la granularità lo richiede.