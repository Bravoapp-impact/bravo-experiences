## Problemi rilevati
1. **Linea della pagina non full-width**: il `border-b` è sul root del `PageHeader`, che vive dentro `<main className="px-4 sm:px-6 lg:px-8">`. La linea quindi rispetta i padding orizzontali del main e lascia ~16/24/32 px vuoti a sinistra e destra. Nello stile Attio invece la linea attraversa tutta la colonna del contenuto fino al bordo della sidebar e al bordo destro della viewport.
2. **Linee non allineate verticalmente**: il blocco profilo in sidebar finisce ~8–10 px più in basso rispetto al PageHeader. Il calcolo "teorico" (12 pt-3 + 44 contenuto + 8 pb-2 = 64 px) torna su entrambi, ma in pratica il contenitore profilo include un `<Button>` con `py-2 px-2` + avatar `h-7`, che genera un'altezza effettiva ≥ 44 px (line-height del testo a due righe `greeting` + `entityName`), mentre il PageHeader sta esattamente a 44 px (min-h). Vanno forzati alla stessa altezza interna.

## Cosa cambia

### 1. `src/components/common/PageHeader.tsx` — linea full-bleed
Sul root del PageHeader:
- Rimuovere `border-b border-border/60` e `pb-2`.
- Aggiungere `relative` e una pseudo-linea che esce dai padding del main:
  `after:absolute after:bottom-0 after:left-[-1rem] after:right-[-1rem] sm:after:left-[-1.5rem] sm:after:right-[-1.5rem] lg:after:left-[-2rem] lg:after:right-[-2rem] after:h-px after:bg-border/60`
- Aggiungere `pb-3` per dare aria fra titolo e linea (il `space-y-6` dei figli successivi tiene già la distanza fra linea e contenuto sotto).

Questo fa scorrere la linea dal bordo destro della sidebar fino al bordo destro della viewport, allineata col layout Attio.

### 2. `src/components/layout/AdminLayout.tsx` — altezza profilo identica all'header
Sul container del profilo (`<div className="px-3 pt-3 pb-2 border-b border-border/60">`):
- Forzare l'altezza interna a 44 px come il PageHeader, eliminando varianza dovuta alle due righe di testo:
  - Sul `<Button>` interno cambiare `h-auto py-2` → `h-11 py-0` (h-11 = 44 px), così il blocco profilo è esattamente 12 + 44 + 8 = 64 px (`pt-3 + h-11 + pb-2`), identico al PageHeader (12 + 44 + pb totale).
  - Mantengo `text-sm` / `text-xs` come oggi: il testo a due righe ci sta dentro 44 px senza overflow (28 px di line-height totale + spazio).
- Stesso `pt-3 pb-2`.

### 3. Verifica Y
Header pagina: `main pt-3 (12) + PageHeader min-h-44 (44) + pb-3 (12) = 68 px` → la linea cade a 68 px.
Sidebar profilo: aggiusto `pb-2` → `pb-3` sul container profilo per pareggiare a 12 + 44 + 12 = 68 px.

→ **Aggiornamento concreto rispetto al primo tentativo**: entrambe le linee a Y = 68 px (era 64), e PageHeader linea full-bleed.

## Cosa NON cambia
- Nessuna modifica a logica, RLS, RPC, edge functions.
- Nessuna modifica ai testi, alle icone, al colore della linea.
- Nessuna modifica agli altri layout (HR/Association/SuperAdmin) — ereditano da `AdminLayout`.
- Nessuna modifica al comportamento mobile della sidebar (overlay).

## Note tecniche
- Pseudo-elemento `after:` evita di toccare la struttura DOM e di richiedere padding speciale al `<main>`.
- L'allineamento è verificabile a occhio sul `/hr/volontariato` (caso d'uso che hai mostrato); se restano sbavature subpixel, si tara `pb-3` di un punto.
