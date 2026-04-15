# Piano: Layout Airbnb-style con hero split-screen

## Cosa cambia

Attualmente la pagina ha l'immagine hero full-width in alto, poi sotto il layout a due colonne (contenuto + sidebar). Come da reference Airbnb, il layout desktop deve diventare:

1. **Header split-screen in alto**: immagine a sinistra (55%) + titolo/descrizione/rating a destra (45%), allineati fianco a fianco
2. **Sotto**: contenuto a sinistra + sidebar sticky date a destra (come oggi, ma la sidebar deve effettivamente seguire lo scroll con `sticky top`)

```text
Desktop (lg+):
┌─────────────────────────────────────────────┐
│  ← Torna al catalogo                        │
├────────────────────┬────────────────────────┤
│                    │  Titolo grande         │
│  [Immagine ~55%]   │  Descrizione           │
│  aspect-square     │  ★ 4.96 · N recension  │
│  rounded           │  Città · Categoria     │
│                    │                        │
├────────────────────┴───────────────────────-┤
│  Contenuto (~60%)  │  Sidebar sticky (~35%  │
│  - Cosa farai      │  - Date disponibili    │
│  - Info utili      │  - Prenota             │
│  - Tag             │                        │
│  - Recensioni      │                        │
│  - Luogo           │                        │
│  - SDGs            │                        │
│  - Associazione    │                        │
├─────────────────────────────────────────────┤
│  Esperienze correlate                       │
└─────────────────────────────────────────────┘
```

**Mobile** resta invariato: immagine full-width sopra, poi contenuto impilato, CTA sticky in basso.

## Modifiche tecniche

### 1. `src/pages/ExperienceDetail.tsx`

- Sostituire il blocco hero full-width + header separato con un **layout split a due colonne** su desktop (`lg:flex lg:gap-10`)
- Colonna sinistra: `HeroImage` con aspect-square (non più 16:10)
- Colonna destra: `ExperienceHeader` + descrizione breve dell'esperienza (prime 2-3 righe) + rating. Allineare tutto al centro, non a sinistra.
- Su mobile: mantenere layout attuale (immagine sopra, header sotto, ma rendere immagine quadrata anche su mobile)
- Verificare che la sidebar abbia effettivamente `sticky top-8` funzionante (potrebbe servire un `self-start`)

### 2. `src/components/experience-detail/HeroImage.tsx`

- Desktop: aspect ratio quadrato (`aspect-square`) o `aspect-[4/5]` per allinearsi alla reference Airbnb
- Mobile: resta `aspect-[4/3]`

### 3. `src/components/experience-detail/ExperienceHeader.tsx`

- Aggiungere prop opzionale `description` per mostrare un estratto breve nel header split
- Tipografia più grande per il titolo nel contesto split (`text-3xl lg:text-4xl`)

### 4. `src/components/experience-detail/DatesSidebar.tsx`

- Aggiungere `self-start` al div sticky per garantire che segua lo scroll correttamente

## File coinvolti


| File                                                    | Modifica                                          |
| ------------------------------------------------------- | ------------------------------------------------- |
| `src/pages/ExperienceDetail.tsx`                        | Ristrutturare sezione hero in layout split-screen |
| `src/components/experience-detail/HeroImage.tsx`        | Aspect ratio quadrato su desktop                  |
| `src/components/experience-detail/ExperienceHeader.tsx` | Supporto descrizione breve inline                 |
| `src/components/experience-detail/DatesSidebar.tsx`     | Fix sticky scroll con `self-start`                |


Nessuna modifica a database o routing.