## Obiettivo
Stile Attio: separare visivamente l'header di pagina dal contenuto con una sottile linea orizzontale, allineata con la stessa linea nella sidebar che divide il blocco profilo dalle voci di menu.

## Cosa cambia

### 1. `src/components/common/PageHeader.tsx`
Aggiungere `border-b border-border/60 pb-3` al contenitore root del componente, così sotto al titolo (e relativa descrizione/azioni) compare una linea sottile che separa l'header dal resto della pagina.

### 2. `src/components/layout/AdminLayout.tsx`
Aggiungere `border-b border-border/60` al `<div className="px-3 pt-3 pb-2">` che contiene il dropdown profilo nella sidebar, in modo che la linea divida il blocco profilo dalle voci di navigazione sottostanti.

### 3. Allineamento verticale
Le due linee devono cadere allo stesso `Y`. Calcolo attuale:
- Sidebar profilo: `pt-3` (12px) + bottone `py-2` con avatar `h-7` (28+16=44px) + `pb-2` (8px) = **64px** dal top.
- Main su desktop: `pt-3` (12px) + `PageHeader min-h-[44px]` (44px) + nuovo `pb-3` (12px) = **68px**.

Per farle combaciare cambio `pb-3` → `pb-2` su PageHeader (totale 64px). Su mobile c'è in più l'header `h-14` (56px) sopra al main, ma la linea sidebar è visibile solo a sidebar aperta in overlay e parte dal top a sé, quindi l'allineamento riguarda la vista desktop (≥ lg) — che è il caso d'uso reale.

## Cosa NON cambia
- Nessuna modifica a logica, routing, RLS, query, edge functions.
- Nessuna modifica agli altri layout (HR/Association/SuperAdmin) — usano tutti `AdminLayout` e `PageHeader`, quindi ereditano il cambio automaticamente.
- Nessuna modifica a colori/tipografia esistenti del titolo.
- Nessuna modifica a spacing dei contenuti sotto l'header (rimangono come oggi grazie a `space-y-*` dei singoli pages).

## Note tecniche
- Colore linea: `border-border/60` per restare sottile e coerente con lo stile flat Attio già adottato.
- Solo Tailwind classes, nessun token nuovo da aggiungere.
