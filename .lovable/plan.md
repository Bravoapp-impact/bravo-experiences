## Estensione BravoCard (L2) + rename delle rich card

Obiettivo: eliminare le duplicazioni residue del pattern "card listing compatta" e rendere esplicita nel naming la separazione fra famiglia *compact* (BravoCard) e famiglia *rich* (card hero/scelta).

Zero modifiche di comportamento utente. Refactor puramente strutturale.

### Step 1 — Estensione minima di BravoCard

File: `src/components/common/BravoCard.tsx`.

Aggiungere una prop opzionale:

```ts
subtitleSlot?: ReactNode;  // riga sotto al titolo, prima della meta
```

Renderizzata fra `<h3>{title}</h3>` e il blocco `metaItems`, dentro la stessa colonna `space-y-1`. Nessuna logica: è uno slot di presentazione.

Nessun'altra prop nuova. `imageOverlay` esiste già.

### Step 2 — Estrazione di `CardAssociationLine`

Nuovo file: `src/components/common/CardAssociationLine.tsx`.

Contiene il pattern "logo cerchiato 3.5×3.5 + nome associazione truncate", oggi duplicato in `ExperienceCardCompact` e nella variante futura di `BookingCard`. API:

```ts
interface CardAssociationLineProps {
  name: string;
  logoUrl?: string | null;
  fallbackEmoji?: string;  // default "🏢"
}
```

Output identico al markup attuale (classi `text-[11px] text-muted-foreground font-light`, etc.). Componente puramente di presentazione, ~25 righe.

### Step 3 — Migrazione di `ExperienceCardCompact` a BravoCard

File: `src/components/experiences/ExperienceCardCompact.tsx`.

Trasforma il body in un wrapper su `<BravoCard>`:

- `imageUrl`, `imageAlt` da `experience`.
- `aspectRatio="square"`.
- `imageOverlay` = badge "Completo" quando `isFull` (stesso markup attuale, posizionato `absolute bottom-2 left-1/2 ...`).
- `badge` di categoria dentro l'immagine: passato come `imageOverlay` aggiuntivo. Per supportare badge categoria + badge "Completo" insieme, l'overlay diventa un `<>...</>` con due figli posizionati assolutamente.
- `title={experience.title}`.
- `subtitleSlot` = `<CardAssociationLine name={...} logoUrl={...} />` quando presente.
- `metaItems` = `[{ text: data formattata }, { icon: Clock, text: durata }, { icon: Users, text: posti }]` filtrati.
- `onOpen` = `navigate(linkPrefix/{id})`.
- `dimmed={isFull}`.

L'API esterna del file (`<ExperienceCardCompact experience index linkPrefix />`) resta identica. Cambia solo l'implementazione. Riduzione: ~125 → ~70 righe.

### Step 4 — Migrazione `BookingCard` futura a BravoCard

File: `src/components/bookings/BookingCard.tsx`.

Solo il branch `!isPast` (Airbnb-style). Il branch passato (row orizzontale) resta invariato.

- `imageOverlay` = badge data calendario (mese + giorno, `bg-background/95 ...`) — è un singolo elemento posizionato top-left.
- `subtitleSlot` = `<CardAssociationLine ... />`.
- `metaItems` = `[{ icon: Clock, text: ora }, { text: durata }, { icon: MapPin, text: città }]`.
- Badge "Annullata" sotto la card → passato come `actions`.
- `onOpen` = `() => onView(booking)`.

Riduzione: ~85 righe del branch futuro → ~40 righe.

### Step 5 — Rename rich card per coerenza

Per rendere esplicita la separazione "BravoCard = compact" vs "card rich":

| Prima | Dopo |
|---|---|
| `src/components/experiences/ExperienceCard.tsx` | `src/components/experiences/ExperienceCardRich.tsx` |
| Export `ExperienceCard` | Export `ExperienceCardRich` |
| `src/components/hr/tb/TBProposalCard.tsx` | `src/components/hr/tb/TBProposalCardRich.tsx` |
| Export `TBProposalCard` | Export `TBProposalCardRich` |

Aggiornare tutti gli import dei call site (verificare con `rg`):
- `ExperienceCard` → usato in `ExperienceSection`, `RelatedExperiencesList`.
- `TBProposalCard` → usato in `HRTBRequestDetailPage`.

`HRExperienceCard` e `BookingCard` **non** vengono rinominati: il primo è un accordion stats (categoria a sé), il secondo è multi-modale (compact + row).

### Step 6 — Memoria del progetto

Aggiungere/aggiornare `mem://style/component-patterns` con la convenzione:
- "Listing compatto griglia → `BravoCard` (slot subtitle/imageOverlay/actions)"
- "Card hero/scelta con descrizione + CTA → suffisso `Rich`"

### Verifiche post-implementazione

1. `bunx tsc --noEmit` pulito.
2. `rg "ExperienceCard\b|TBProposalCard\b"` non deve trovare riferimenti ai nomi vecchi (eccetto i file rinominati).
3. Confronto visivo (utente o dev): apri `/app/experiences` (grid + scroll orizzontale), `/app/bookings` (card future), `/hr/team-building/:id` (proposte). Nessuna differenza pixel.

### Cosa NON viene toccato

- `HRExperienceCard` (accordion stats HR).
- `BookingCard` ramo `isPast` (row orizzontale).
- Riga `Card` di `HRTeamBuildingPage` (lista richieste TB).
- Tabella `TBFormatsPage` super-admin.
- `BravoCard` non guadagna prop `variant` né nessun altro polimorfismo: resta una sola forma.

### File toccati (riepilogo)

Creati:
- `src/components/common/CardAssociationLine.tsx`

Modificati:
- `src/components/common/BravoCard.tsx` (+1 prop)
- `src/components/experiences/ExperienceCardCompact.tsx` (refactor body)
- `src/components/bookings/BookingCard.tsx` (refactor branch futuro)

Rinominati (con aggiornamento import nei call site):
- `src/components/experiences/ExperienceCard.tsx` → `ExperienceCardRich.tsx`
- `src/components/hr/tb/TBProposalCard.tsx` → `TBProposalCardRich.tsx`
- `src/components/experiences/ExperienceSection.tsx` (import update)
- `src/components/experience-detail/RelatedExperiencesList.tsx` (import update)
- `src/pages/hr/HRTBRequestDetailPage.tsx` (import update)

Memoria:
- `mem://style/component-patterns` (aggiornamento convenzione)
