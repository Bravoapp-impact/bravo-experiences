

# Fix: doppio separatore, sidebar sticky, esperienze correlate

## Problema 1: Doppio separatore
C'è un `<Separator>` a riga 415 di `ExperienceDetail.tsx` e un altro dentro `RelatedExperiences.tsx` (riga 65). Rimuovo quello dentro `RelatedExperiences.tsx`.

## Problema 2: Sidebar non sticky
Il `DatesSidebar` ha internamente `sticky top-8 self-start`, ma è wrappato in un `<motion.div>` (riga 514) che non ha quelle classi. Il motion wrapper "consuma" l'altezza e impedisce lo sticky. Soluzione: aggiungere `sticky top-8 self-start` al `<motion.div>` wrapper oppure rimuovere il wrapper motion e lasciare che sia il div del DatesSidebar a gestire lo sticky.

## Problema 3: Esperienze correlate non visibili
`RelatedExperiences` è dentro la colonna sinistra del layout a due colonne (`lg:flex`), quindi è schiacciata al 60% e potrebbe non renderizzare correttamente. Va spostata **fuori** dal container `lg:flex`, in modo che sia full-width sotto il layout a due colonne.

## File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/ExperienceDetail.tsx` | Spostare RelatedExperiences fuori dal layout a 2 colonne; fix motion wrapper sidebar |
| `src/components/experience-detail/RelatedExperiences.tsx` | Rimuovere il Separator interno |

