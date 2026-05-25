## Obiettivo
Sostituire l'icona della voce "Attività" nella nav dipendente con il simbolo Bravo!, mantenendo lo stesso comportamento delle altre icone lucide (currentColor + colori active/inactive).

## Step

1. **Copia asset**
   - `code--copy user-uploads://bravo-symbol.svg src/assets/bravo-symbol.svg`

2. **Crea componente icona wrapper** `src/components/icons/BravoSymbolIcon.tsx`
   - Importa l'SVG come componente React con `?react` (vite-plugin-svgr) — se non disponibile nel progetto, fallback: definire inline il path SVG dentro un componente React che accetta `className` e usa `fill="currentColor"`, `viewBox="0 0 14446.39 12862.08"`, `preserveAspectRatio="xMidYMid meet"`.
   - Verifico prima la disponibilità di svgr; in caso negativo uso fallback inline (path copiati da `src/assets/bravo-symbol.svg`).
   - Il componente accetta `className` e applica `fill="currentColor"` così eredita il colore del testo.

3. **BottomNavigation.tsx** (mobile)
   - Sostituire `Calendar` con `BravoSymbolIcon` solo per la voce "Attività".
   - Le altre icone (Search, Sprout, User) restano invariate.
   - Per bilanciamento ottico: icona più piccola delle lucide `h-6 w-6` → usare `h-5 w-5` per il simbolo, centrato nello stesso box `h-6 w-6` (wrapper flex). In pratica: wrap in `<div className="h-6 w-6 flex items-center justify-center">` con `<BravoSymbolIcon className="h-5 w-5 ..." />`.
   - Mantiene le stesse classi colore `text-primary` / `text-muted-foreground` per active/inactive.

4. **AppLayout.tsx** (desktop)
   - Sostituire `Calendar className="h-4 w-4"` nel Link `/app/bookings` con `BravoSymbolIcon` dentro un wrapper `h-4 w-4 flex items-center justify-center` con icona `h-[13px] w-[13px]` (leggermente ridotta per pareggiare il peso visivo).
   - Rimuovere import `Calendar` se non usato altrove nei due file.

## Note tecniche
- `fill="currentColor"` nel SVG implica che basta applicare classi tailwind di testo (`text-primary`, `text-muted-foreground`) sul componente per ottenere il color-shift identico alle icone lucide.
- Proporzioni mantenute via `viewBox` + nessun `width`/`height` fissi sull'SVG (solo classi tailwind).
- Scope strettamente limitato alla voce "Attività" in entrambi i file.
