## Problema

Le 4 metric card della pagina `/hr/users` sono più alte del contenuto: dopo la rimozione della percentuale "X% dei registrati" dalla card "Attivi", in `EmployeeMetricsCards.tsx` è rimasto un placeholder `min-h-[14px]` con `\u00A0` che riserva spazio per un sottotitolo che ora non esiste mai. Inoltre il padding `p-4 sm:p-5` è tarato per card con 3 righe di testo, mentre ora ne abbiamo solo 2.

## Fix

In `src/components/hr/EmployeeMetricsCards.tsx`:

1. Rimuovere il blocco `<p>` del `subLabel` (riga ~104-106) e il relativo campo `subLabel` da `MetricDef` — non viene più usato da nessuna card.
2. Ridurre il padding del `CardContent` da `p-4 sm:p-5` a `p-4` per dare alle card un'altezza coerente con 2 righe di contenuto (numero + label).
3. Rimuovere `h-full` dal `<div>` interno (riga 95) — serviva solo a far stirare il contenuto quando una card aveva il subLabel; ora non è più necessario.

Tutte le card restano della stessa altezza tra loro (`grid` + `h-full` sulla `Card`) ma più basse rispetto a ora.

## File toccati

- `src/components/hr/EmployeeMetricsCards.tsx` — solo questo
