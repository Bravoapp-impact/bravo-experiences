## Obiettivo
La riga orizzontale delle esperienze in `Esplora` arriva a filo del bordo destro. Aggiungere spazio finale dopo l'ultima card, come fa Airbnb.

## Causa
In `src/components/experiences/ExperienceSection.tsx`, lo scroller usa `-mx-8` con `px-8`: il padding destro (32px) viene "mangiato" perché il contenitore esterno della pagina (container Tailwind) ha un padding inferiore, quindi visivamente le card finiscono a filo schermo.

## Fix (un solo file)
`src/components/experiences/ExperienceSection.tsx` — sul div interno con `flex items-start gap-2.5 px-8`, sostituire `px-8` con `pl-8 pr-16` (mobile) e mantenere proporzioni su desktop con `md:pr-20`. Risultato: ~64px di spazio dopo l'ultima card su mobile, ~80px su desktop, coerente con il pattern Airbnb.

## Fuori scope
Tutto il resto (altre liste, RelatedExperiencesList, layout pagina, navigazione).
