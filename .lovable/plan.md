

## Obiettivo

Replicare il layout Airbnb per la fine pagina:
1. **"Altre esperienze"** dentro la colonna sinistra (sotto le altre sezioni del contenuto), con titolo dinamico che include la città, scroll orizzontale con sfumatura sul lato destro (per evitare che le card vadano sotto la sidebar sticky).
2. **Separatore full-width** (tutta la pagina) che chiude lo scroll della sidebar sticky, con un po' di respiro tra fine sidebar e separatore.
3. **"Informazioni per i partecipanti"** come ultima sezione, full-width sotto il separatore (non più dentro la colonna sinistra).

## Layout finale

```text
[Hero split-screen]
─────────────────────────────────────
[Colonna sinistra: WhatYouWillDo,  ] [Sidebar sticky]
[ TagsSection, Reviews, Meeting,   ] [Date          ]
[ SDG, Association, RelatedExp     ] [disponibili   ]
─────────────── separator full-width ───────────────
[ParticipantInfo full-width (ultima sezione)]
```

## Modifiche

### 1. `src/pages/ExperienceDetail.tsx`
- **Spostare `ParticipantInfo`** fuori dal div `lg:flex lg:gap-12`, posizionandolo dopo il separatore finale come ultima sezione full-width.
- **Spostare `RelatedExperiences`** dentro la colonna sinistra (dentro `flex-1 min-w-0 space-y-8`), come ultima sezione di quella colonna, dopo `AssociationProfile`.
- **Rimuovere** il `motion.div` esterno con `<Separator className="mb-8" />` che ora avvolge `RelatedExperiences`.
- **Aggiungere separatore full-width** dopo la chiusura del layout `lg:flex`, con `mt-16` per dare respiro tra fine sidebar sticky e separatore.
- Passare `cityName` a `RelatedExperiences` per il titolo dinamico.

### 2. `src/components/experience-detail/RelatedExperiences.tsx`
- Aggiungere prop `cityName: string | null`.
- Cambiare titolo in: `Altre esperienze a {cityName}` (fallback: "Altre esperienze nella stessa città").
- Aggiungere **sfumatura (gradient fade) sul lato destro** dello scroll orizzontale per ricordare che le card scorrono sotto la sidebar sticky:
  - Wrapper `relative`
  - Pseudo-elemento via div assoluto: `absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none`
- Rimuovere `Separator` interno (già fatto).
- Layout cards rimane scroll orizzontale (`overflow-x-auto`).

## File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/ExperienceDetail.tsx` | Riorganizzare ordine sezioni: RelatedExp dentro colonna, separatore full-width, ParticipantInfo come ultima full-width |
| `src/components/experience-detail/RelatedExperiences.tsx` | Prop `cityName`, titolo dinamico, fade gradient destro |

Nessuna modifica DB/RLS.

