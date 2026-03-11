

# Fix: Nascondere esperienze senza date future dal catalogo

## Problema

La pagina `Experiences.tsx` carica tutte le esperienze `published`, poi recupera solo le date future. Le esperienze con sole date passate restano nella lista con array date vuoto, il che causa `availableSpots = 0` e il badge "Completo" (posti esauriti).

## Soluzione

Una riga di codice in `src/pages/Experiences.tsx`: dopo la riga 87, filtrare le esperienze che hanno almeno una data futura.

```typescript
// Riga ~83-88 attuale:
setExperiences(
  baseExperiences.map((exp) => ({
    ...exp,
    experience_dates: datesByExperienceId.get(exp.id) ?? [],
  })),
);

// Diventa:
const experiencesWithDates = baseExperiences
  .map((exp) => ({
    ...exp,
    experience_dates: datesByExperienceId.get(exp.id) ?? [],
  }))
  .filter((exp) => exp.experience_dates.length > 0);

setExperiences(experiencesWithDates);
```

## Rischio
Zero. Rimuove solo esperienze senza date future dalla vista catalogo. Non tocca DB, RLS, o altre pagine.

## File da modificare
| File | Modifica |
|------|----------|
| `src/pages/Experiences.tsx` | Aggiungere `.filter()` dopo `.map()` (righe 83-88) |

