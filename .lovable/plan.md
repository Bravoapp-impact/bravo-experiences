## Obiettivo
Correggere la pagina di dettaglio esperienza di volontariato rimuovendo la sezione "Caratteristiche" (secondary tags) e aggiungendo una mini-mappa embeddata nella sezione "Dove ci incontreremo".

## Modifiche previste

### 1. Rimuovere "Caratteristiche" da ExperienceDetailContent.tsx
- Rimuovere l'import di `TagsSection` (riga 9).
- Rimuovere il blocco `<motion.div>` che renderizza `<TagsSection>` (righe 114-123), incluso il `<Separator>` associato e la condizione `experience.secondary_tags && ...`.
- `TagsSection.tsx` NON viene eliminato: resta usato da `TBFormatDetailContent.tsx`.

### 2. Embed mappa in MeetingPlace.tsx
- Sotto il link "Apri in Google Maps" esistente, aggiungere un `<iframe>` con src:
  `https://www.google.com/maps?q={indirizzo+url-encoded}&output=embed`
  dove l'indirizzo è la concatenazione di `address` + `cityName` già presente nel componente.
- L'iframe avrà:
  - `width="100%"`, altezza fissa ~260px
  - `loading="lazy"`
  - `title="Mappa del luogo di incontro"`
  - `rounded-xl` per coerenza col design system
  - `border-1` per bordo coerente
- Renderizzato condizionalmente solo se `address` è presente e non vuoto.
- Il link testuale "Apri in Google Maps" resta invariato.

### 3. Documentazione
- Aggiungere entry in `docs/log.md` datata 2026-05-20 che riassume: rimossa sezione Caratteristiche, aggiunta mappa embed in MeetingPlace. Notare che `TagsSection` è rimasto intatto perché usato da TBFormatDetailContent.

## Cosa NON viene fatto
- Nessuna modifica a `TagsSection.tsx`, `TBFormatDetailContent.tsx`, schema DB, form creazione esperienza, geocoding, API key Google.

## Verifica
- Dettaglio volontariato (dipendente/HR/ETS): nessuna sezione Caratteristiche, mappa visibile sotto l'indirizzo.
- Dettaglio format TB: sezione tag ancora presente.
- Esperienza senza indirizzo: nessun iframe rotto.