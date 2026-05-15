## Diagnosi
La sezione "Altre esperienze a Milano" che ancora vedi non veniva da `HRRelatedExperiences` (che ho rimosso): è il **fallback di default** dentro `ExperienceDetailContent.tsx` (riga 182):

```tsx
{relatedExperiencesSlot ?? (
  <RelatedExperiences ... companyId={relatedCompanyId} />
)}
```

Visto che HR ora non passa più `relatedExperiencesSlot`, il componente cade nel default `<RelatedExperiences />`. Per HR vogliamo invece sopprimere completamente la sezione (è una vista informativa, non discovery).

## Cosa cambia

### 1. `src/components/experience-detail/ExperienceDetailContent.tsx`
- Aggiungere prop opzionale `showRelatedExperiences?: boolean` (default `true`).
- Avvolgere il blocco `motion.div` riga 176-190 in `{showRelatedExperiences && (...)}`.

### 2. `src/pages/hr/HRExperienceDetail.tsx`
- Passare `showRelatedExperiences={false}` a `ExperienceDetailContent`.
- Rimuovere anche il prop `relatedCompanyId` (non più necessario per HR, era usato solo da quel blocco).

## Cosa NON cambia
- Comportamento employee/association: `showRelatedExperiences` ha default `true`, nessuna regressione.
- Nessuna modifica a fetch, RLS, altri slot, sidebar HR.
