## Obiettivo

Sostituire l'attuale tema scuro (cool/blu-grigio "Attio-inspired") con la nuova palette **Warm Elevated** fornita: grigi caldi (hue 15-25°), brand viola alleggerito, card più chiare del background, sidebar più scura.

## Cosa cambia

Modifica unica a **`src/index.css`**, blocco `.dark { ... }`. Nessun altro file viene toccato — tutti i componenti usano già i token `hsl(var(--...))` e si aggiorneranno automaticamente. Nessuna modifica al tema chiaro, ai componenti, o all'admin scoped override.

### Mapping dei token nel blocco `.dark`

Sostituisco i valori attuali con quelli della palette caldi mantenendo **tutte le variabili che il nostro design system usa** (alcune non sono nel file fornito e vanno preservate/derivate coerentemente):

**Surfaces (warm gray)**
- `--background: 20 8% 10%`
- `--card: 15 8% 13%` + `--card-foreground: 25 12% 93%`
- `--popover: 15 8% 13%` + `--popover-foreground: 25 12% 93%`
- `--muted: 15 7% 16%` + `--muted-foreground: 20 6% 63%`
- `--secondary: 15 7% 16%` + `--secondary-foreground: 25 12% 93%` (derivati da muted, stessa famiglia calda)
- `--accent: 15 7% 19%` + `--accent-foreground: 25 12% 96%` (un gradino sopra muted per hover)
- `--border: 20 8% 20%`
- `--input: 18 7% 11%`
- `--ring: 274 100% 60%` (uso il primary per il focus ring, coerente col light theme che usa `--ring` brand-aware nel resto del sistema; il valore "neutral warm" `20 6% 50%` del file è troppo poco visibile per accessibilità focus)

**Text**
- `--foreground: 25 12% 93%`

**Brand & status** (presi 1:1 dal file)
- `--primary: 274 100% 60%` / `--primary-foreground: 0 0% 100%`
- `--success: 142 60% 50%` / `--warning: 38 85% 55%` / `--destructive: 0 75% 60%` (+ `-foreground` invariati: bianco / nero / bianco)
- Bravo accents: `--bravo-purple/magenta/pink/orange/yellow` aggiornati ai valori del file

**Sidebar** (allineato al pattern del light theme + nota "darker than bg" del file: `20 8% 7%`)
- `--sidebar-background: 20 8% 7%`
- `--sidebar-foreground: 20 6% 75%`
- `--sidebar-primary: 274 100% 60%` / `--sidebar-primary-foreground: 0 0% 100%`
- `--sidebar-accent: 15 7% 16%` / `--sidebar-accent-foreground: 25 12% 96%`
- `--sidebar-border: 20 8% 14%`
- `--sidebar-ring: 274 100% 60%`

**Gradients**
- `--gradient-hero: linear-gradient(135deg, hsl(274 100% 55%) 0%, hsl(330 56% 55%) 50%, hsl(26 100% 60%) 100%)` (dal file)
- `--gradient-card: linear-gradient(180deg, hsl(15 8% 13%) 0%, hsl(15 8% 14%) 100%)` (rigenerato sulla nuova card)

**Admin panel scoped override** (`.dark .admin-panel`): mantengo l'attuale `--primary: 274 65% 65%` perché è una variante intenzionalmente più desaturata per le aree admin. Aggiorno solo `--foreground` a `25 12% 93%` per coerenza con la nuova palette calda.

### Cosa NON faccio

- Non importo le regole extra del file (`.dark .sidebar { background: hsl(20 8% 7%) }`, `.dark .nav-item-active { ... }`): non usiamo selettori `.sidebar`/`.nav-item-active` nel codebase, e l'effetto "sidebar più scura" è già ottenuto via `--sidebar-background`.
- Non aggiungo le variabili `--shadow-*` del file: il progetto usa le shadow di Tailwind, non token custom. Aggiungerle ora sarebbe codice morto.
- Non aggiungo le `--cat-*` (category colors): non sono usate come CSS variables nel progetto (i colori categoria sono gestiti diversamente, vedi memory `category-color-palette`). Skippo per evitare divergenze.
- Non tocco light theme, `tailwind.config.ts`, componenti.

## Verifica post-applicazione

Dopo la modifica, controllerò visivamente in dark mode:
- Pagina employee (`/app/experiences`) — card più chiare del bg, leggibilità testi
- HR settings (`/hr/impostazioni/*`) — sidebar più scura, focus ring viola visibile
- Super admin panel — admin scoped primary resta desaturato come prima
