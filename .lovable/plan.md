## Obiettivo
Correggere la fascia alta della pagina Profilo (employee) per renderla più compatta e navigabile, con due tile stile Airbnb al posto della card identità sovraccarica e dell'anteprima inline.

## Modifiche a `src/pages/Profile.tsx`

### 1. Card Identità — rimozione numeri
- Rimuovere la sezione `grid grid-cols-2` con "Esperienze completate" e "Ore donate" dentro la `Card` identità.
- La card resta con: avatar editabile (`ProfileAvatarUpload`), nome, azienda.

### 2. Tile affiancate sotto la card
- Aggiungere un `grid grid-cols-2 gap-3` subito sotto la card identità.
- **Tile sinistra — "Esperienze completate"**: icona `Award`, numero derivato da `completedCount`, label. Al tap naviga a `/app/esperienze-completate`.
- **Tile destra — "Ore donate"**: icona `Clock`, numero derivato da `totalHoursLabel`, label. Al tap naviga a `/app/impact`.
- Entrambe le tile sono `Card` tappabili con `Link` interno, animazione `motion` con delay progressivo.
- Stati di caricamento: `Skeleton` al posto dei numeri quando `completedLoading` è true.

### 3. Rimozione sezione inline "Esperienze completate"
- Eliminare l'intera sezione FASCIA 2 con le `CompletedExperienceCard` di anteprima, il link "Vedi tutte", il `BookingDetailModal` e il `FeedbackModal`.

### 4. Pulizia codice
- Rimuovere gli import non più usati: `CompletedExperienceCard`, `CompletedExperienceBooking`, `CompletedExperienceReview`, `BookingDetailModal`, `FeedbackModal`, `ArrowRight`.
- Rimuovere gli stati non più necessari: `reviews`, `selectedBooking`, `feedbackBooking`.
- Rimuovere `fetchReviews`, `handleFeedbackSubmitted` e la loro invocazione.
- Mantenere `fetchCompleted`, `completed`, `completedLoading`, `completedCount`, `totalHoursLabel` — servono per le tile.

### Fuori scope
- Nessuna modifica a `/app/esperienze-completate`, `CompletedExperienceCard`, `/app/bookings`, bottom nav, pagine admin, logica di redirect ruoli.