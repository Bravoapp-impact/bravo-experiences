# Convenzioni di data fetching

_Documento vivo — versione 1.0, 18 aprile 2026_

Questo documento definisce come si scrivono i data hook in Bravo!. Viene prima del codice, non dopo: se stai per scrivere `useState + useEffect + supabase` per caricare dati, fermati e leggi qui.

## Stack e principio

Usiamo `@tanstack/react-query` (già installato, `QueryClientProvider` già montato in `App.tsx`). Ogni chiamata di lettura dati da Supabase passa da `useQuery`. Ogni scrittura passa da `useMutation`. Non ci sono eccezioni nel codice nuovo.

Il motivo è pratico, non ideologico: query cache condivisa tra pagine (il dipendente torna al catalogo e non rifetcha), invalidation automatica dopo mutation (prenoti un'esperienza, la lista "le mie prenotazioni" si aggiorna da sola), loading/error/empty gestiti in modo uniforme, niente race condition quando l'utente cambia pagina durante una fetch.

## Dove vivono gli hook

Tutti i data hook TanStack Query vivono in `src/hooks/queries/`, organizzati per entità:

```
src/hooks/queries/
├── experiences/
│   ├── keys.ts
│   ├── useExperiencesList.ts
│   ├── useExperienceDetail.ts
│   └── useRelatedExperiences.ts
├── bookings/
│   ├── keys.ts
│   ├── useMyBookings.ts
│   └── useCreateBooking.ts
└── impact/
    ├── keys.ts
    ├── useCompanyImpact.ts
    └── useUserImpact.ts
```

Gli hook legacy (`useState + useEffect`) restano in `src/hooks/` finché non vengono migrati. Non spostiamo niente in blocco, migriamo un hook alla volta quando tocchiamo la pagina che lo consuma.

## queryKey: la convenzione più importante

Ogni `queryKey` è un array. La forma è **sempre**:

```
[entity, operation, ...params]
```

Esempi:

```ts
['experiences', 'list', { cityId, companyId }]
['experiences', 'detail', experienceId]
['experiences', 'related', 'employee', { currentId, cityId, companyId }]
['experiences', 'related', 'hr', { currentId, cityId, companyId }]
['bookings', 'list', 'my', userId]
['impact', 'company', { companyId, from, to }]
```

Le queryKey vivono in `keys.ts` dentro la cartella dell'entità, esportate come oggetto con funzioni factory. Questo serve per invalidare le query giuste dopo una mutation senza rischiare di sbagliarne la forma:

```ts
// src/hooks/queries/experiences/keys.ts
export const experienceKeys = {
  all: ['experiences'] as const,
  lists: () => [...experienceKeys.all, 'list'] as const,
  list: (filters: { cityId?: string; companyId?: string }) =>
    [...experienceKeys.lists(), filters] as const,
  details: () => [...experienceKeys.all, 'detail'] as const,
  detail: (id: string) => [...experienceKeys.details(), id] as const,
  related: (ctx: 'employee' | 'hr', params: RelatedParams) =>
    [...experienceKeys.all, 'related', ctx, params] as const,
};
```

Dopo una mutation su experiences, per invalidare tutte le liste basta `queryClient.invalidateQueries({ queryKey: experienceKeys.lists() })`.

## Struttura standard di un data hook

Un hook di lettura ha sempre questa forma:

```ts
// src/hooks/queries/experiences/useRelatedExperiences.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { experienceKeys } from './keys';
import type { Experience } from '@/types/experiences';

interface Params {
  currentExperienceId: string;
  cityId: string | null;
  companyId: string | null;
}

export function useRelatedExperiencesForEmployee(params: Params) {
  return useQuery({
    queryKey: experienceKeys.related('employee', params),
    queryFn: async () => {
      if (!params.cityId || !params.companyId) return [];
      const { data, error } = await supabase
        .from('experiences')
        .select(/* ... */)
        .eq('city_id', params.cityId)
        // ...
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!params.cityId && !!params.companyId,
    staleTime: 1000 * 60 * 2, // 2 minuti
  });
}
```

Cose importanti:

- **`enabled`** va usato quando l'hook ha parametri nullable. Niente guard clause con `useEffect`.
- **`staleTime`** di default è 0 (rifetcha sempre). Per dati che cambiano poco (categorie, città) metti valori alti (10 minuti o più). Per dati che cambiano spesso (bookings, feedback) tieni 0 o 30 secondi.
- **L'hook restituisce l'oggetto di `useQuery` così com'è**: `{ data, isLoading, isError, error, refetch, ... }`. Non destrutturare dentro l'hook, lasciare al consumer.
- **Gli errori si lanciano**: `if (error) throw error`. TanStack Query li cattura e li espone come `isError + error`.

## Mutations

Forma standard:

```ts
// src/hooks/queries/bookings/useCreateBooking.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingKeys } from './keys';
import { experienceKeys } from '../experiences/keys';

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBookingPayload) => {
      const { data, error } = await supabase.from('bookings').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.my(variables.userId) });
      queryClient.invalidateQueries({ queryKey: experienceKeys.detail(variables.experienceId) });
    },
  });
}
```

L'`onSuccess` è il posto dove decidi quali query rendere stale. Se ne dimentichi una, la UI mostrerà dati vecchi finché l'utente non rifà F5.

## Come il consumer usa l'hook

```tsx
const { data: experiences = [], isLoading, isError } = useRelatedExperiencesForEmployee({
  currentExperienceId: id,
  cityId: experience.city_id,
  companyId: profile?.company_id ?? null,
});

if (isLoading) return <LoadingState />;
if (isError) return <ErrorState />;
return <RelatedExperiencesList experiences={experiences} />;
```

La pagina/componente consumer non fa mai più `useState + useEffect` per caricare dati. Se lo vedi in un PR, è un blocco alla merge.

## Cosa NON copriamo in questa versione

Per disciplina, queste cose **non** sono incluse nello scaffold e le affronteremo solo se servono davvero:

- **Optimistic updates**: complicate da scrivere bene, utili solo dove la latenza percepita è un problema concreto. Non le introduciamo per default.
- **Infinite query / paginazione**: utile se e quando il catalogo esplode. Per ora limit fisso.
- **Error handling globale**: TanStack Query ha `QueryCache.onError`. Non lo configuriamo ora — ogni hook gestisce il suo errore a livello di componente con `isError`.
- **Suspense**: richiederebbe di rifare l'albero di rendering. Fuori scope.

Se uno di questi punti diventa necessario per una feature futura, aggiorniamo questo documento.

## Processo di migrazione

Non riscriviamo tutto il codebase. Ogni hook legacy viene migrato **quando la pagina che lo consuma viene toccata** per un'ondata della roadmap. Eccezioni: i due hook esemplari (`useRelatedExperiences` + un hook del catalogo) che migriamo subito come riferimento.

Quando migri un hook legacy:
1. Crea il nuovo hook in `src/hooks/queries/<entity>/`.
2. Aggiorna il consumer per usarlo.
3. Elimina il vecchio hook da `src/hooks/`.
4. Non fare altro nello stesso PR (no refactor incidentali).

## Scelte di default

**`staleTime` di default: 0.** Ogni query viene considerata stantia appena montata e rifetchata in background. Mentre la fetch va, i dati in cache vengono mostrati (schermo stabile, nessuno sfarfallio). Così evitiamo il rischio di mostrare dati vecchi quando l'utente fa un'azione che modifica lo stato (es. prenota e torna alla lista). Per dati che cambiano di rado (categorie, città, SDG, tassonomie), il singolo hook sovrascrive con `staleTime` alto (10 minuti o più). Per dati molto dinamici (bookings dell'utente, feedback), resta a 0.

**Devtools TanStack Query attivi in development: sì.** Installato `@tanstack/react-query-devtools`. Aggiunge un pannello accessibile da un'icona in basso a destra, visibile **solo in `NODE_ENV=development`**. Serve per debug — vedere quali query sono attive, cosa c'è in cache, quando si invalida. Non impatta il bundle di produzione.
