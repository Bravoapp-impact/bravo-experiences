
User has given precise implementation instructions. Simple plan to confirm approach.

## Modifiche

### 1. `src/components/experience-detail/RelatedExperiences.tsx`
- Aggiungere prop `companyId: string | null`
- Sostituire join `experience_dates!inner` con `experience_companies!inner (company_id)`
- Filtrare con `.eq("experience_companies.company_id", companyId)`
- Early return se `!cityId || !companyId`
- Mapping con `experience_dates: []`
- Aggiungere `companyId` alla dependency array dell'useEffect

### 2. `src/pages/ExperienceDetail.tsx`
- Importare/usare `profile` da `useAuth` (già presente)
- Passare `companyId={profile?.company_id ?? null}` a `<RelatedExperiences>`

## File coinvolti

| File | Modifica |
|------|----------|
| `src/components/experience-detail/RelatedExperiences.tsx` | Nuova prop `companyId`, query con join `experience_companies!inner` |
| `src/pages/ExperienceDetail.tsx` | Passare `companyId` da `profile` al componente |

Nessuna modifica DB/RLS.
