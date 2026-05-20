## Problema

1. **`short_description` non viene mostrata** nel dettaglio esperienza. Il campo viene salvato in DB ed è fetchato dalla pagina ETS, ma `ExperienceHeader` ignora il campo e mostra invece i primi 180 caratteri di `description`. La pagina dipendente e quella HR non lo fetchano nemmeno.

2. **Sezione "Altre esperienze a {città}"** ancora visibile nel dettaglio dipendente (`/app/experiences/:id`). Va rimossa.

## Modifiche

### 1. Type + Header (sorgente unico)

- `src/types/experiences.ts`: aggiungere `short_description?: string | null` su `Experience`.
- `src/components/experience-detail/ExperienceHeader.tsx`:
  - Aggiungere prop `shortDescription?: string | null`.
  - Mostrare `shortDescription` se presente; altrimenti fallback al truncate di `description` (logica attuale). Stesso styling.
- `src/components/experience-detail/ExperienceDetailContent.tsx`: passare `shortDescription={experience.short_description ?? null}` a `ExperienceHeader`.

### 2. Fetch nelle 3 pagine di dettaglio

- `src/pages/ExperienceDetail.tsx` (dipendente): aggiungere `short_description: data.short_description ?? null` nel setExperience.
- `src/pages/hr/HRExperienceDetail.tsx`: stesso campo nel mapping.
- `src/pages/association/AssociationExperienceDetail.tsx`: già fetchato, ma controllare che venga inoltrato all'oggetto passato a `ExperienceDetailContent` (riga ~359 lo fa già — verificare e basta).

### 3. Rimuovere "Altre esperienze" dal dettaglio dipendente

Due opzioni equivalenti:
- A) In `src/pages/ExperienceDetail.tsx` passare `showRelatedExperiences={false}` a `ExperienceDetailContent` (prop già esistente, già usata da HR).
- B) Rimuovere del tutto la prop default-true e cancellare `RelatedExperiences.tsx` + hook `useRelatedExperiencesForEmployee` se non più usati altrove.

Andrei con **A** per minimizzare il blast radius: lascia il componente disponibile ma spento sul dipendente. Se confermi che non lo userai mai più, faccio cleanup completo (B) in un secondo passo.

### 4. Docs

- `docs/log.md`: entry datata 2026-05-20 — "short_description ora visibile nell'header del dettaglio (3 pagine) + sezione Altre esperienze rimossa dal dettaglio employee".

## Fuori scope

- Nessuna modifica DB (colonna già esistente).
- Nessuna modifica ai form di creazione/edit.
- Nessun cleanup dei file `RelatedExperiences*` (rinviato a step successivo se confermato).

## Verifica

- Aprire un'esperienza esistente con `short_description` valorizzata → testo mostrato sotto il titolo.
- Aprire un'esperienza senza `short_description` → fallback alla descrizione troncata (comportamento attuale).
- Stessa verifica nelle viste HR ed ETS.
- Sul dettaglio dipendente la sezione "Altre esperienze a Milano" non compare più.
