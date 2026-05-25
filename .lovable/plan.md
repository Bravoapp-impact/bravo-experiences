## Obiettivo
Semplificare la pagina `Profile.tsx` del dipendente.

## Modifiche

**1. Rimuovere tile "Ore donate"** — eliminare il blocco motion.div (linee 184-208) e rimuovere la grid wrapper `grid-cols-2` (linee 157-209) dato che resta un solo elemento. Rimuovere anche calcolo `totalHours` / `totalHoursLabel` ora inutilizzato e l'import `Clock` se non più usato altrove (resta usato nell'hour budget row, quindi tengo l'import).

**2. Trasformare "Esperienze completate" in riga flat** — stile identico a Impostazioni (linee 257-271):
- Link a `/app/esperienze-completate`
- Wrapper icona `w-10 h-10 rounded-full bg-amber-500/10` (tinta colorata coerente con l'icona)
- `Award` con `text-amber-500 h-5 w-5`
- Titolo: "Esperienze completate"
- Sottotitolo: count dinamico, es. `"{n} esperienze"` (o "Nessuna esperienza" / "1 esperienza"); Skeleton durante loading
- `ChevronRight` a destra

## Fuori scope
Identity card, hour budget row, Impostazioni, logout.
