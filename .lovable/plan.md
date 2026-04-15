# Piano: Riscrittura completa ExperienceDetail.tsx (Airbnb-style)

## Panoramica

Riscrittura totale della pagina dettaglio esperienza (`/app/experiences/:id`) ispirata al layout Airbnb Experiences. Da una pagina semplice a colonna singola a un layout professionale con due colonne su desktop (contenuto + sidebar sticky) e colonna singola con CTA sticky su mobile.

## Struttura del file

Il file `ExperienceDetail.tsx` attuale (567 righe) verra riscritto completamente. Per mantenere il codice gestibile, le sezioni principali verranno estratte in sotto-componenti nella cartella `src/components/experience-detail/`.

```text
src/components/experience-detail/
├── HeroImage.tsx            -- Immagine hero 4:3 con fallback
├── ExperienceHeader.tsx     -- Titolo, categoria, citta, durata, rating
├── WhatYouWillDo.tsx        -- Sezione "Cosa farai" con expand
├── ParticipantInfo.tsx      -- Info utili come bullet list
├── TagsSection.tsx          -- secondary_tags come badge
├── ReviewsSection.tsx       -- Rating + lista recensioni
├── MeetingPlace.tsx         -- Indirizzo + link Google Maps
├── SdgSection.tsx           -- Badge SDG
├── AssociationProfile.tsx   -- Mini profilo associazione
├── RelatedExperiences.tsx   -- Carosello altre esperienze stessa citta
├── DatesSidebar.tsx         -- Sidebar sticky desktop con date
├── MobileDateDrawer.tsx     -- Drawer bottom-sheet mobile con date
└── DateSlotCard.tsx         -- Card singola data (riusata in sidebar e drawer)
```

## Layout

```text
Desktop (lg+):
┌─────────────────────────────────────────────┐
│  ← Torna al catalogo                        │
├─────────────────────────────────────────────┤
│  [Hero Image - full width, aspect 16:10]    │
├──────────────────────┬──────────────────────┤
│  Contenuto (~60%)    │  Sidebar (~35%)      │
│                      │  position: sticky    │
│  - Titolo + key info │  top: 2rem           │
│  - Cosa farai        │                      │
│  - Info utili        │  - Prossime 5 date   │
│  - Tag               │  - Mostra tutte      │
│  - Recensioni        │  - Bottone Prenota   │
│  - Luogo incontro    │  - Budget ore        │
│  - SDGs              │                      │
│  - Associazione      │                      │
├──────────────────────┴──────────────────────┤
│  Altre esperienze nella stessa citta        │
└─────────────────────────────────────────────┘

Mobile:
┌─────────────────────┐
│ ← Torna al catalogo │
│ [Hero full-width]   │
│ Titolo + key info   │
│ Cosa farai          │
│ Info utili          │
│ Tag                 │
│ Recensioni          │
│ Luogo incontro      │
│ SDGs                │
│ Associazione        │
│ Altre esperienze    │
│                     │
│ ─── sticky bottom ──│
│ [Vedi date]         │
└─────────────────────┘
```

## Query dati

La query principale carica l'esperienza con join su:

- `associations` (nome, logo, description)
- `categories` (nome)  
- `cities` (nome)

Query separate per:

- **Date future**: `experience_dates` filtrate per `experience_id`, `start_datetime > now()`, con count booking confermati
- **Recensioni**: `experience_reviews` join `bookings` join `experience_dates` join `profiles` (per nome/avatar reviewer), filtrate per `experience_id`
- **Booking utente**: bookings dell'utente corrente per le date di questa esperienza
- **Esperienze correlate**: experiences con stesso `city_id`, `status = published`, `visibility = public`, limit 6, esclusa quella corrente

## Sezioni dettagliate

1. **Hero**: Aspect ratio `aspect-[16/10]` desktop, `aspect-[4/3]` mobile. Fallback con emoji e sfondo muted.
2. **Header**: Titolo `text-2xl lg:text-3xl font-bold`. Sotto: categoria, citta, durata ore, rating medio (se ci sono recensioni).
3. **Cosa farai**: Testo description con troncamento a ~5 righe e "Mostra altro" per espandere.
4. **Info utili**: Solo se `participant_info` non e vuoto. Ogni riga diventa un bullet point.
5. **Tag**: Solo se `secondary_tags` presente. Badge/chip con stile secondario.
6. **Recensioni**: Header "★ X.XX · N recensioni". Griglia 1-2 colonne con avatar, nome, stelle, data relativa, testo. Max 6, poi "Mostra tutte le recensioni".
7. **Luogo**: Indirizzo + link Google Maps.
8. **SDGs**: Badge colorati come oggi.
9. **Associazione**: Logo grande, nome, description breve, bottone "Scopri di piu".
10. **Correlate**: Carosello orizzontale con ExperienceCardCompact esistente.

## Sidebar / CTA mobile

- **Desktop**: `position: sticky; top: 2rem`. Lista prime 5 date future. Ogni data mostra giorno/data in italiano, orario, posti disponibili (o "Tutto esaurito" / "Prenotato"). Click seleziona, appare bottone "Prenota". Budget ore mostrato se non unlimited.
- **Mobile**: Barra fissa in basso con "Vedi date disponibili". Click apre Drawer (shadcn) con lista completa date + bottone Prenota.

## Logica booking

Identica a quella attuale: insert in `bookings`, gestione errori (duplicato, budget), toast conferma, invocazione edge function `send-booking-confirmation`. Dopo il booking, aggiornamento stato locale (data prenotata, posti aggiornati).

## Pagina successo

Dopo prenotazione confermata: overlay/modale di successo con emoji, messaggio, bottoni "Le mie prenotazioni" e "Torna al catalogo" (come oggi).

## File coinvolti


| File                                     | Azione                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/pages/ExperienceDetail.tsx`         | Riscrittura completa                                                                                                 |
| `src/components/experience-detail/*.tsx` | 13 nuovi sotto-componenti                                                                                            |
| `src/types/experiences.ts`               | Estensione con campi aggiuntivi (category_name, city_name, association data, secondary_tags, default_hours, city_id) |


Nessuna modifica a database, RLS o routing.

## Dipendenze

- `date-fns` + locale `it` (gia presente)
- `framer-motion` (gia presente)
- shadcn `Drawer` (gia presente)
- shadcn `Separator` (gia presente)
- Hook `useHourBudget` (gia presente)
- Hook `useIsMobile` (gia presente)