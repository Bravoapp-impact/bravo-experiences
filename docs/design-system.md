# Bravo! Design System

Guida completa al design system di Bravo!, ispirato allo stile pulito e minimalista di Airbnb.

---

## 🎨 Filosofia di Design

- **Semplicità**: Interfacce pulite, senza elementi superflui
- **Neutralità**: Hover states e sfondi neutri (grigi), colori usati con parsimonia
- **Consistenza**: Stesso look & feel in tutta l'applicazione
- **Accessibilità**: Contrasti adeguati, focus states visibili

---

## 🎭 Colori

### Background

| Token | Valore HSL | Hex | Utilizzo |
|-------|-----------|-----|----------|
| `--background` | `0 0% 98%` | `#FAFAFA` | Background principale di tutta l'app |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card e superfici elevate |
| `--muted` | `0 0% 96%` | `#F5F5F5` | Background hover, stati disabilitati |

### Testo

| Token | Valore HSL | Utilizzo |
|-------|-----------|----------|
| `--foreground` | `0 0% 10%` | Testo principale |
| `--muted-foreground` | `0 0% 45%` | Testo secondario, descrizioni |

### Brand Bravo!

| Token | Valore HSL | Nome | Utilizzo |
|-------|-----------|------|----------|
| `--primary` | `274 100% 50%` | Viola Bravo! | CTA principali, link, icone di brand |
| `--bravo-magenta` | `290 67% 46%` | Magenta | Accent decorativo (solo su hero/auth) |
| `--bravo-pink` | `330 56% 53%` | Rosa | Accent decorativo (solo su hero/auth) |
| `--bravo-orange` | `26 100% 65%` | Arancione | Accent decorativo |
| `--bravo-yellow` | `45 96% 61%` | Giallo | Accent decorativo |

### Stati

| Token | Valore HSL | Utilizzo |
|-------|-----------|----------|
| `--success` | `142 71% 45%` | Conferme, stati positivi |
| `--warning` | `38 92% 50%` | Avvisi |
| `--destructive` | `0 84% 60%` | Errori, azioni distruttive |

### Interazione

| Token | Valore HSL | Utilizzo |
|-------|-----------|----------|
| `--accent` | `0 0% 96%` | **Hover states** (grigio neutro!) |
| `--ring` | `0 0% 20%` | Focus ring (grigio scuro) |
| `--border` | `0 0% 90%` | Bordi elementi |

---

## 🎯 Colori Icone per Metriche

Le icone nelle card metriche usano colori **tematici** per identificare visivamente il tipo di dato.

**IMPORTANTE**: Non usare `text-accent` o `text-secondary` per le icone (sono grigi per gli hover states).

| Metrica | Icona | Colore | Background |
|---------|-------|--------|------------|
| Dipendenti / Persone | `Users`, `UserCheck` | `text-bravo-purple` | `bg-bravo-purple/10` |
| Esperienze / Eventi | `Calendar`, `Award` | `text-bravo-purple` | `bg-bravo-purple/10` |
| Tempo / Ore | `Clock` | `text-bravo-orange` | `bg-bravo-orange/10` |
| Beneficiari / Cuore | `Heart`, `Users` (beneficiari) | `text-bravo-pink` | `bg-bravo-pink/10` |
| Trend / Crescita | `TrendingUp` | `text-success` | `bg-success/10` |
| Partecipazioni | `CheckCircle`, `CalendarCheck` | `text-bravo-purple` | `bg-bravo-purple/10` |

### Pattern per Card Metriche

```tsx
// ✅ Corretto - colori tematici
<div className="p-2.5 sm:p-3 rounded-xl bg-bravo-orange/10">
  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-bravo-orange" />
</div>

// ❌ Non fare - accent/secondary sono grigi
<div className="p-2.5 sm:p-3 rounded-xl bg-accent/10">
  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
</div>
```

---

## 🏷️ Colori per Categorie Esperienze

Le categorie di esperienze usano colori tematici per identificarle visivamente nelle card e nei filtri.

| Categoria | Colore | Classe Testo | Classe Background |
|-----------|--------|--------------|-------------------|
| Ambiente / Natura | Verde | `text-emerald-600` | `bg-emerald-500/10` |
| Sociale / Comunità | Rosa | `text-bravo-pink` | `bg-bravo-pink/10` |
| Educazione / Formazione | Blu | `text-blue-600` | `bg-blue-500/10` |
| Animali | Arancione | `text-bravo-orange` | `bg-bravo-orange/10` |
| Cultura / Arte | Viola | `text-bravo-purple` | `bg-bravo-purple/10` |
| Salute / Benessere | Rosso tenue | `text-rose-600` | `bg-rose-500/10` |
| Sport / Attività fisiche | Ciano | `text-cyan-600` | `bg-cyan-500/10` |
| Gastronomia | Giallo | `text-bravo-yellow` | `bg-bravo-yellow/10` |
| Orti e apicoltura | Verde lime | `text-lime-600` | `bg-lime-500/10` |
| Inclusione | Magenta | `text-bravo-magenta` | `bg-bravo-magenta/10` |
| Default | Grigio neutro | `text-muted-foreground` | `bg-muted` |

### Pattern per Badge Categoria

```tsx
// ✅ Corretto - colori tematici per categoria
<Badge className="bg-emerald-500/10 text-emerald-600 border-0">
  Ambiente
</Badge>

// Oppure con sfondo più neutro
<Badge variant="secondary" className="text-emerald-600">
  Ambiente
</Badge>
```

### Mapping Categorie (esempio)

```tsx
const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  ambiente: { text: "text-emerald-600", bg: "bg-emerald-500/10" },
  sociale: { text: "text-bravo-pink", bg: "bg-bravo-pink/10" },
  educazione: { text: "text-blue-600", bg: "bg-blue-500/10" },
  animali: { text: "text-bravo-orange", bg: "bg-bravo-orange/10" },
  cultura: { text: "text-bravo-purple", bg: "bg-bravo-purple/10" },
  salute: { text: "text-rose-600", bg: "bg-rose-500/10" },
  sport: { text: "text-cyan-600", bg: "bg-cyan-500/10" },
  gastronomia: { text: "text-bravo-yellow", bg: "bg-bravo-yellow/10" },
  orti: { text: "text-lime-600", bg: "bg-lime-500/10" },
  inclusione: { text: "text-bravo-magenta", bg: "bg-bravo-magenta/10" },
};

// Utilizzo
const colors = CATEGORY_COLORS[categoryKey] ?? { text: "text-muted-foreground", bg: "bg-muted" };
```

---

## ✏️ Tipografia

### Font Family
```css
font-family: 'Plus Jakarta Sans', sans-serif;
letter-spacing: -0.3px;
line-height: 1.3em;
```

### Dimensioni - Scala Unificata

L'app segue una scala tipografica **unificata** su tutti i dispositivi (mobile, tablet, desktop) per garantire consistenza visiva.

**⚠️ IMPORTANTE: NON usare breakpoint responsivi per i font (es. `sm:text-*`, `md:text-*`, `lg:text-*`).**

| Utilizzo | Classe | Esempio |
|----------|--------|---------|
| Titolo pagina | `text-xl font-bold tracking-tight` | "Esperienze di volontariato" |
| Sottotitolo pagina | `text-[13px] text-muted-foreground` | "Scopri le opportunità disponibili" |
| Titolo sezione | `text-base font-semibold` | "Prossime esperienze" |
| Titolo card | `text-[13px] font-medium` | Titolo esperienza |
| Testo secondario card | `text-[11px] text-muted-foreground font-light` | Associazione, data, durata |
| Badge card | `text-[10px] font-medium` | Categoria |
| Card metriche value | `text-xl font-bold` | "245" |
| Card metriche label | `text-[11px] text-muted-foreground` | "Ore donate" |
| Empty state title | `text-base font-semibold` | "Nessuna prenotazione" |
| Empty state desc | `text-[13px] text-muted-foreground` | Descrizione |
| Input placeholder | `text-[13px]` | "Cerca..." |
| Bottom nav label | `text-[10px] font-medium` | "Esplora", "Prenotazioni" |

### Pattern da Evitare

```tsx
// ❌ NON FARE - breakpoint responsivi per font
<h1 className="text-xl md:text-2xl lg:text-3xl">Titolo</h1>
<p className="text-sm sm:text-base">Descrizione</p>

// ✅ FARE - dimensioni fisse unificate
<h1 className="text-xl font-bold tracking-tight">Titolo</h1>
<p className="text-[13px] text-muted-foreground">Descrizione</p>
```

### Icone - Dimensioni Compatte

| Contesto | Dimensione | Classe |
|----------|------------|--------|
| Icone inline card | 10px | `h-2.5 w-2.5` |
| Logo associazione card | 14px | `w-3.5 h-3.5` |
| Icone metriche | 20-24px | `h-5 w-5 sm:h-6 sm:w-6` |
| Icone empty state | 40px | `h-10 w-10` |
| Icone navigation | 24px | `h-6 w-6` |

---

## 📐 Spacing

### Padding Standard

| Componente | Mobile | Desktop |
|------------|--------|---------|
| Card content | `p-4` | `p-5` o `p-6` |
| Page container | `px-4 py-6` | `p-6` |
| Section gap | `space-y-4` | `space-y-6` |

### Gap tra elementi

| Contesto | Classe |
|----------|--------|
| Card grid | `gap-3 sm:gap-4` |
| Elementi inline | `gap-2` |
| Icon + text | `gap-1.5` o `gap-2` |

---

## 🧩 Componenti

### Card vs Sezione piatta (Attio-style)

**Regola fondamentale:** la `<Card>` è riservata a blocchi che devono **spiccare visivamente come oggetti a sé stanti** sulla pagina. In tutti gli altri casi (tabelle, liste, form, widget di dashboard, contenuti dentro modali) il contenitore è **piatto sul background di pagina** e separato con hairline `border-b border-border`.

Vale per **tutta l'app autenticata** (HR, Super Admin, Association) e anche dentro **modali e dialog**. La sezione employee mobile-first segue lo stesso principio.

**Quando usare `<Card>`:**
- ✅ Sidebar di dettaglio (es. sidebar nella pagina esperienza)
- ✅ Item di una grid/catalogo (card esperienza, card format TB)
- ✅ Hero metric card su dashboard (KPI principali che devono saltare all'occhio)
- ✅ Empty state che deve attirare l'attenzione

**Quando NON usare `<Card>` (usa `<PageSection>` o un semplice `<div>` con divisori):**
- ❌ Wrapper attorno a tabelle e liste → flat con `border-b` tra le righe
- ❌ Filtri sopra le tabelle → flat
- ❌ Form e sezioni di settings → flat, separate da spacing/hairline
- ❌ Widget secondari di dashboard → flat
- ❌ Contenuti dentro modali (no card annidate)

```tsx
// ✅ Corretto: lista/tabella piatta
<PageSection title="Utenti" description="Gestione team">
  <Table>...</Table>
</PageSection>

// ✅ Corretto: card solo dove deve spiccare
<Card className="border bg-card">
  <CardContent className="p-4 sm:p-5">...</CardContent>
</Card>

// ❌ Non fare: card wrapper attorno a una tabella
<Card>
  <CardContent>
    <Table>...</Table>
  </CardContent>
</Card>

// ❌ Non fare: gradienti o bordi colorati
<Card className="bg-gradient-to-br from-primary/10 ...">
<Card className="hover:border-primary/30 hover:shadow-primary/5">
```

**Regole Card (quando serve):**
- Background: `bg-card` o nessuna classe (default)
- Bordo: `border` o `border-border/50`
- Hover: `hover:shadow-md` (ombre neutre, MAI colorate)
- NO gradienti colorati
- NO bordi colorati al hover

Riferimenti: `src/components/common/PageSection.tsx`, memoria `mem://style/card-vs-flat-section`.

### Button

```tsx
// Varianti disponibili
<Button>Primary (default)</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>
```

**Hover States:**
- `default`: `hover:bg-primary/90`
- `outline` / `ghost`: `hover:bg-muted` (grigio chiaro, MAI colorato)
- `secondary`: `hover:bg-muted`

### Badge

```tsx
// Varianti
<Badge>Default (viola)</Badge>
<Badge variant="secondary">Secondary (grigio)</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>
```

**Regole Badge:**
- `secondary`: sfondo `bg-muted text-foreground` (grigio neutro)
- `outline`: bordo `border-border` (visibile ma discreto)
- NO hover effects sui badge (non sono interattivi)

### Input / Select

```tsx
// Focus state standard
className="focus:ring-ring" // Ring grigio scuro, non viola
```

**Regole Form Elements:**
- Focus ring: grigio scuro (`--ring: 0 0% 20%`)
- Hover su opzioni: `hover:bg-muted` o `focus:bg-muted`
- NO `focus:bg-accent` se accent è colorato

### Toggle / Navigation

```tsx
// Stato attivo
className="data-[state=on]:bg-muted data-[state=on]:text-foreground"

// Hover
className="hover:bg-muted"
```

---

## 🔲 Hover States

### Regola Generale

**Tutti gli hover devono essere neutri (grigi), MAI colorati.**

| Elemento | Hover State Corretto |
|----------|---------------------|
| Bottoni outline/ghost | `hover:bg-muted` |
| Card cliccabili | `hover:shadow-md` |
| Righe tabella | `hover:bg-muted/50` |
| Link testuali | `hover:underline` |
| Select/Dropdown items | `focus:bg-muted` |
| Navigation items | `hover:bg-muted` |
| Toggle/Tab | `hover:bg-muted` |

### Pattern da Evitare

```tsx
// ❌ NON FARE
hover:bg-accent          // Se accent è colorato
hover:border-primary/50  // Bordi colorati
hover:shadow-primary/5   // Ombre colorate
hover:text-primary       // Cambio colore testo

// ✅ FARE
hover:bg-muted           // Grigio chiaro
hover:shadow-md          // Ombra neutra
hover:underline          // Per link
```

---

## 📱 Responsive

### Breakpoints

Utilizziamo i breakpoint standard di Tailwind:

| Breakpoint | Min-width | Utilizzo |
|------------|-----------|----------|
| `sm:` | 640px | Tablet portrait |
| `md:` | 768px | Tablet landscape |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Desktop large |

### Pattern Mobile-First

```tsx
// Sempre partire da mobile
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
  ...
</div>

// Padding responsive
<CardContent className="p-4 sm:p-5">
  ...
</CardContent>
```

---

## 🚫 Cosa NON Fare

### Colori

- ❌ Non usare `bg-white` → usa `bg-card` o `bg-background`
- ❌ Non usare `text-black` → usa `text-foreground`
- ❌ Non usare colori hex diretti → usa sempre token CSS
- ❌ Non usare `bg-gradient-*` sulle card normali

### Hover

- ❌ Non usare `hover:bg-accent` se accent è colorato
- ❌ Non usare `hover:border-primary/X`
- ❌ Non usare `hover:shadow-primary/X`
- ❌ Non usare `group-hover:text-primary` sui titoli

### Stile

- ❌ Non usare `bg-pattern` (rimosso dal design system)
- ❌ Non usare gradienti colorati per card informative
- ❌ Non usare badge troppo saturi per info neutrali

---

## ✅ Checklist per Nuovi Componenti

1. [ ] Background usa token semantici (`bg-card`, `bg-background`, `bg-muted`)
2. [ ] Testo usa token semantici (`text-foreground`, `text-muted-foreground`)
3. [ ] Hover states sono neutri (grigi)
4. [ ] Focus ring usa `--ring` (grigio scuro)
5. [ ] Card non hanno gradienti colorati
6. [ ] Ombre sono neutre (`shadow-sm`, `shadow-md`)
7. [ ] Badge usa varianti appropriate
8. [ ] Componente è responsive (mobile-first)

---

## 🔄 Migrazione da Vecchio Stile

Se trovi componenti con il vecchio stile, aggiornali così:

| Vecchio | Nuovo |
|---------|-------|
| `hover:bg-accent` | `hover:bg-muted` |
| `hover:border-primary/50` | rimuovi |
| `hover:shadow-primary/5` | `hover:shadow-md` |
| `bg-gradient-to-br from-primary/10` | `bg-card` |
| `focus:bg-accent` | `focus:bg-muted` |
| `bg-pattern` | rimuovi |
| `bg-white` | `bg-card` |

---

## 🏢 Aree Admin - Template Struttura Pagina

### Layout Sidebar Unificato

Tutti i pannelli admin (Super Admin, HR Admin, Association Admin) usano lo stesso pattern di layout:

```text
AdminLayout
├── Sidebar (w-64, bg-card/95 backdrop-blur-md, border-r border-border/50)
│   ├── Header (h-16): Logo Bravo! + Close button mobile
│   ├── Identity Badge (p-4): Badge ruolo/entità centrato (bg-primary/10 text-primary)
│   ├── Navigation (ScrollArea h-[calc(100vh-10rem)]): Menu items (space-y-1)
│   └── User Footer (fixed bottom): Dropdown utente con avatar
├── Mobile Header (sticky, h-16): Hamburger + Logo + Badge
└── Main Content (p-4 sm:p-6 lg:p-8)
```

**Regole Sidebar:**
- Larghezza: `w-64`
- Sfondo: `bg-card/95 backdrop-blur-md`
- Bordo: `border-r border-border/50`
- Header: `h-16` con Logo Bravo! (come immagine o testo)
- Badge identità: `bg-primary/10 text-primary`, centrato, `py-1.5`, larghezza piena
- Item attivo: `bg-primary text-primary-foreground`
- Item hover: `hover:bg-muted hover:text-foreground`

### Struttura Pagina Standard

Ogni pagina admin segue questo template:

```tsx
<Layout>
  <div className="space-y-6">
    
    {/* 1. HEADER - Sempre presente */}
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Titolo</h1>
      <p className="text-muted-foreground mt-1 text-sm sm:text-base">
        Descrizione breve
      </p>
    </motion.div>

    {/* 2. METRICHE (opzionale) - Per dashboard con KPI */}
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Metric Cards */}
      </div>
    </motion.div>

    {/* 3. CONTENUTO PRINCIPALE */}
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        {/* Table, Grid o altro contenuto */}
      </Card>
    </motion.div>

  </div>
</Layout>
```

### Animazioni Standard

| Elemento | Animazione |
|----------|------------|
| Header pagina | `initial={{ opacity: 0, y: -10 }}` |
| Contenuto | `initial={{ opacity: 0, y: 10 }}, transition={{ delay: 0.1-0.2 }}` |
| Items lista/grid | `transition={{ delay: index * 0.05 }}` |
| Card metriche | `transition={{ delay: index * 0.1 }}` |

### Card Container Standard

Tutte le card admin usano:

```tsx
<Card className="border-border/50 bg-card/80 backdrop-blur-sm">
  <CardContent className="p-4 sm:p-6">
    ...
  </CardContent>
</Card>

// Con hover (per card cliccabili)
<Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
```

---

## 🧱 Componenti Riutilizzabili

Una serie di componenti condivisi è disponibile in `src/components/common/` e `src/components/profile/` per garantire consistenza e ridurre la duplicazione di codice.

### PageHeader

Header standard per tutte le pagine con titolo, descrizione e azioni opzionali.

**Path:** `src/components/common/PageHeader.tsx`

```tsx
import { PageHeader } from "@/components/common/PageHeader";

<PageHeader
  title="Aziende"
  description="Gestisci le aziende clienti della piattaforma"
  actions={
    <Button onClick={handleCreate}>
      <Plus className="h-4 w-4 mr-2" />
      Nuova Azienda
    </Button>
  }
/>
```

**Props:**
| Prop | Tipo | Obbligatorio | Descrizione |
|------|------|--------------|-------------|
| `title` | `string` | ✅ | Titolo principale (h1) |
| `description` | `string` | ❌ | Sottotitolo descrittivo |
| `actions` | `ReactNode` | ❌ | Bottoni o azioni (allineati a destra su desktop) |
| `className` | `string` | ❌ | Classi CSS aggiuntive |

---

### MetricCard

Card per visualizzare metriche/KPI con icona tematica e animazione.

**Path:** `src/components/common/MetricCard.tsx`

```tsx
import { MetricCard } from "@/components/common/MetricCard";

<MetricCard
  label="Ore di Volontariato"
  value={245}
  icon={Clock}
  iconColor="text-bravo-orange"
  iconBgColor="bg-bravo-orange/10"
  subLabel="ultimo mese"
  animationDelay={0.1}
/>
```

**Props:**
| Prop | Tipo | Obbligatorio | Descrizione |
|------|------|--------------|-------------|
| `label` | `string` | ✅ | Etichetta della metrica |
| `value` | `string \| number` | ✅ | Valore numerico o testuale |
| `icon` | `LucideIcon` | ✅ | Icona Lucide da mostrare |
| `iconColor` | `string` | ✅ | Classe colore testo icona (es. `text-bravo-orange`) |
| `iconBgColor` | `string` | ✅ | Classe colore sfondo icona (es. `bg-bravo-orange/10`) |
| `subLabel` | `string` | ❌ | Etichetta secondaria sotto il valore |
| `animationDelay` | `number` | ❌ | Delay animazione Framer Motion (default: 0) |
| `className` | `string` | ❌ | Classi CSS aggiuntive |

---

### LoadingState

Stato di caricamento standard con spinner e messaggio.

**Path:** `src/components/common/LoadingState.tsx`

```tsx
import { LoadingState } from "@/components/common/LoadingState";

// Uso base
<LoadingState />

// Con messaggio custom
<LoadingState message="Caricamento dipendenti..." />

// Altezza ridotta (non full viewport)
<LoadingState message="Attendere..." fullHeight={false} />
```

**Props:**
| Prop | Tipo | Obbligatorio | Default | Descrizione |
|------|------|--------------|---------|-------------|
| `message` | `string` | ❌ | `"Caricamento..."` | Messaggio sotto lo spinner |
| `fullHeight` | `boolean` | ❌ | `true` | Se `true`, occupa `min-h-[60vh]` |

---

### EmptyState

Stato vuoto standard per liste, tabelle e sezioni senza dati.

**Path:** `src/components/common/EmptyState.tsx`

```tsx
import { EmptyState } from "@/components/common/EmptyState";

// Con icona Lucide
<EmptyState
  icon={Users}
  title="Nessun dipendente trovato"
  description="Non ci sono dipendenti che corrispondono ai filtri."
/>

// Con emoji
<EmptyState
  icon="🎉"
  title="Nessuna notifica"
  description="Sei tutto in pari!"
/>

// Con azione
<EmptyState
  icon={Calendar}
  title="Nessuna esperienza"
  description="Non hai ancora prenotato esperienze."
  action={
    <Button onClick={handleExplore}>
      Esplora esperienze
    </Button>
  }
/>
```

**Props:**
| Prop | Tipo | Obbligatorio | Descrizione |
|------|------|--------------|-------------|
| `icon` | `LucideIcon \| string` | ❌ | Icona Lucide o emoji |
| `title` | `string` | ✅ | Titolo dello stato vuoto |
| `description` | `string` | ❌ | Descrizione aggiuntiva |
| `action` | `ReactNode` | ❌ | Bottone o link per azione |
| `className` | `string` | ❌ | Classi CSS aggiuntive |

---

### BaseCardImage

Componente per la gestione uniforme delle immagini nelle card in stile Airbnb. Supporta aspect ratio, fallback emoji e badge overlay.

**Path:** `src/components/common/BaseCardImage.tsx`

```tsx
import { BaseCardImage } from "@/components/common/BaseCardImage";

// Uso base con immagine quadrata
<BaseCardImage
  imageUrl={experience.image_url}
  alt={experience.title}
/>

// Con badge overlay (es. categoria o data)
<BaseCardImage
  imageUrl={experience.image_url}
  alt={experience.title}
  aspectRatio="square"
  badge={
    <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm">
      Ambiente
    </Badge>
  }
  badgePosition="top-left"
/>

// Aspect ratio diverso e emoji custom
<BaseCardImage
  imageUrl={null}
  alt="Placeholder"
  aspectRatio="video"
  fallbackEmoji="🎉"
/>
```

**Props:**
| Prop | Tipo | Obbligatorio | Default | Descrizione |
|------|------|--------------|---------|-------------|
| `imageUrl` | `string \| null` | ✅ | - | URL dell'immagine |
| `alt` | `string` | ✅ | - | Testo alternativo per accessibilità |
| `aspectRatio` | `"square" \| "video" \| "portrait"` | ❌ | `"square"` | Aspect ratio dell'immagine |
| `fallbackEmoji` | `string` | ❌ | `"🤝"` | Emoji mostrata se `imageUrl` è null |
| `badge` | `ReactNode` | ❌ | - | Contenuto overlay (Badge, data, etc.) |
| `badgePosition` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | ❌ | `"top-left"` | Posizione del badge |
| `className` | `string` | ❌ | - | Classi CSS per il container |
| `imageClassName` | `string` | ❌ | - | Classi CSS per l'immagine |

**Aspect Ratio:**
- `square`: `aspect-square` (1:1) - default per card esperienze/prenotazioni
- `video`: `aspect-video` (16:9) - per banner o preview video
- `portrait`: `aspect-[3/4]` (3:4) - per immagini verticali

**Caratteristiche:**
- Rounded-2xl standard
- Transizione hover `scale-105` (richiede `group` sul parent)
- Fallback con emoji centrata su sfondo `bg-muted`

---

### BaseModal

Componente wrapper per modal in stile bottom-sheet (mobile-first) con supporto per header, back button e animazioni Framer Motion.

**Path:** `src/components/common/BaseModal.tsx`

```tsx
import { BaseModal, ModalCloseButton } from "@/components/common/BaseModal";

// Modal semplice (bottom-sheet mobile, centered desktop)
<BaseModal open={isOpen} onClose={() => setIsOpen(false)}>
  <div className="p-5">
    <h2>Contenuto modal</h2>
    <p>Il tuo contenuto qui...</p>
  </div>
</BaseModal>

// Modal con header (back + title + close)
<BaseModal
  open={isOpen}
  onClose={handleClose}
  showBackButton
  onBack={handleBack}
  title="Seleziona una data"
>
  <div className="p-5">
    {/* Contenuto */}
  </div>
</BaseModal>

// Modal con close button overlay (no header)
<BaseModal open={isOpen} onClose={handleClose}>
  <div className="relative">
    <div className="absolute top-4 right-4 z-10">
      <ModalCloseButton onClick={handleClose} />
    </div>
    <BaseCardImage imageUrl={image} alt="Preview" />
    <div className="p-5">{/* Contenuto */}</div>
  </div>
</BaseModal>
```

**Props BaseModal:**
| Prop | Tipo | Obbligatorio | Default | Descrizione |
|------|------|--------------|---------|-------------|
| `open` | `boolean` | ✅ | - | Controlla visibilità modal |
| `onClose` | `() => void` | ✅ | - | Callback alla chiusura |
| `children` | `ReactNode` | ✅ | - | Contenuto del modal |
| `showBackButton` | `boolean` | ❌ | `false` | Mostra freccia back nell'header |
| `onBack` | `() => void` | ❌ | `onClose` | Callback per back button |
| `title` | `string` | ❌ | - | Titolo centrato nell'header |
| `showCloseButton` | `boolean` | ❌ | `true` | Mostra X nell'header |
| `className` | `string` | ❌ | - | Classi CSS per il container modal |

**Props ModalCloseButton:**
| Prop | Tipo | Obbligatorio | Descrizione |
|------|------|--------------|-------------|
| `onClick` | `() => void` | ✅ | Callback al click |
| `className` | `string` | ❌ | Classi CSS aggiuntive |

**Comportamento:**
- **Mobile**: Bottom-sheet con `rounded-t-3xl`, slide-up animation
- **Desktop** (sm+): Modal centrato con `rounded-3xl`
- Z-index: `z-[100]` per sovrapporsi alla navigazione
- Max height: `95vh` mobile, `90vh` desktop
- Backdrop: `bg-black/50 backdrop-blur-sm`

**Pattern consigliato per modal con immagine:**

```tsx
<BaseModal open={!!selectedItem} onClose={() => setSelectedItem(null)}>
  <div className="flex flex-col max-h-[95vh] sm:max-h-[90vh]">
    {/* Close button overlay */}
    <div className="absolute top-4 right-4 z-10">
      <ModalCloseButton onClick={() => setSelectedItem(null)} />
    </div>

    {/* Scrollable content */}
    <div className="flex-1 overflow-y-auto">
      <BaseCardImage imageUrl={item.image} alt={item.title} className="rounded-none" />
      <div className="p-5 space-y-4">
        {/* Contenuto */}
      </div>
    </div>

    {/* Fixed footer */}
    <div className="flex-shrink-0 p-5 border-t border-border bg-background">
      <Button className="w-full h-12">Conferma</Button>
    </div>
  </div>
</BaseModal>
```

---

## 📜 Scroll Orizzontale (Airbnb-style Edge-to-Edge)

Per sezioni con card scrollabili orizzontalmente che escono da entrambi i lati dello schermo:

```tsx
// Container con margine negativo su entrambi i lati per edge-to-edge completo
<div className="overflow-x-auto scrollbar-hide -mx-8">
  <div className="flex gap-2.5 px-8">
    {items.map(...)}
  </div>
</div>
```

**Come funziona:**
- `-mx-8` compensa il padding del container (32px) su entrambi i lati
- `px-8` aggiunge padding interno per allineare la prima card e bilanciare l'ultima
- Le card scrollano fuori schermo sia a sinistra che a destra (come Airbnb)
- `gap-2.5` (10px) mantiene le card separate ma compatte
- `scrollbar-hide` nasconde la scrollbar mantenendo la funzionalità

**Calcolo per iPhone 375px:**
- Card da 145px + gap 10px = 2 card complete + ~33px peek della terza
- Il peek invita l'utente a scrollare

**File di riferimento:** `src/components/experiences/ExperienceSection.tsx`

---

### ProfileEditForm

Form riutilizzabile per la modifica del profilo utente (nome, cognome).

**Path:** `src/components/profile/ProfileEditForm.tsx`

```tsx
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";

<ProfileEditForm
  profile={profile}
  onSave={refreshProfile}
  cardClassName="border-0 shadow-none" // opzionale per stili custom
/>
```

**Props:**
| Prop | Tipo | Obbligatorio | Descrizione |
|------|------|--------------|-------------|
| `profile` | `Profile` | ✅ | Oggetto profilo utente |
| `onSave` | `() => void` | ✅ | Callback chiamata dopo salvataggio |
| `cardClassName` | `string` | ❌ | Classi CSS per la Card container |

**Funzionalità incluse:**
- Validazione Zod (nome e cognome obbligatori, min 2 caratteri)
- Gestione stato di salvataggio
- Toast di feedback (successo/errore)
- Integrazione diretta con Supabase

---

## 📋 CRUD Table Pattern

Un pattern completo per pagine CRUD (Create, Read, Update, Delete) che riduce il boilerplate di ~150-200 righe per pagina mantenendo flessibilità per casi complessi.

**Path:** `src/components/crud/` e `src/hooks/useCrudState.ts`

---

### useCrudState Hook

Hook generico per centralizzare stato e operazioni CRUD con Supabase.

```tsx
import { useCrudState } from "@/hooks/useCrudState";

interface City {
  id: string;
  name: string;
  province: string | null;
  region: string | null;
  created_at: string;
}

const {
  items,           // T[] - tutti gli elementi
  filteredItems,   // T[] - elementi filtrati dalla ricerca
  loading,         // boolean - stato caricamento
  saving,          // boolean - stato salvataggio
  searchTerm,      // string - termine di ricerca
  setSearchTerm,   // (v: string) => void
  selectedItem,    // T | null - elemento selezionato per edit/delete
  setSelectedItem, // (item: T | null) => void
  dialogOpen,      // boolean - dialog create/edit aperto
  setDialogOpen,   // (open: boolean) => void
  deleteDialogOpen,// boolean - dialog delete aperto
  setDeleteDialogOpen, // (open: boolean) => void
  fetchItems,      // () => Promise<void> - ricarica manuale
  handleSave,      // (payload, onSuccess?) => Promise<boolean>
  handleDelete,    // (onSuccess?) => Promise<boolean>
} = useCrudState<City>({
  tableName: "cities",
  orderBy: { column: "name", ascending: true },
  searchFields: ["name", "province", "region"],
  fetchOnMount: true, // default: true
  idField: "id",      // default: "id"
});
```

**Opzioni:**
| Opzione | Tipo | Obbligatorio | Default | Descrizione |
|---------|------|--------------|---------|-------------|
| `tableName` | `string` | ✅ | - | Nome tabella Supabase |
| `orderBy` | `{ column, ascending? }` | ❌ | - | Ordinamento risultati |
| `searchFields` | `(keyof T)[]` | ❌ | `[]` | Campi per filtro ricerca |
| `fetchOnMount` | `boolean` | ❌ | `true` | Carica dati al mount |
| `idField` | `keyof T` | ❌ | `"id"` | Campo identificativo |

---

### CrudTableCard

Card wrapper con header, conteggio, search e slot per filtri/azioni.

```tsx
import { CrudTableCard } from "@/components/crud";

<CrudTableCard
  title={`${cities.length} Città`}
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  searchPlaceholder="Cerca città..."
  filters={<SelectFilter />}  // slot opzionale
  actions={<ExportButton />}  // slot opzionale
>
  <Table>...</Table>
</CrudTableCard>
```

**Props:**
| Prop | Tipo | Obbligatorio | Descrizione |
|------|------|--------------|-------------|
| `title` | `string` | ✅ | Titolo con conteggio (es. "12 Città") |
| `searchValue` | `string` | ✅ | Valore corrente della ricerca |
| `onSearchChange` | `(v: string) => void` | ✅ | Handler cambio ricerca |
| `searchPlaceholder` | `string` | ❌ | Placeholder input ricerca |
| `filters` | `ReactNode` | ❌ | Slot per filtri aggiuntivi |
| `actions` | `ReactNode` | ❌ | Slot per azioni header |
| `children` | `ReactNode` | ✅ | Contenuto (Table) |
| `className` | `string` | ❌ | Classi CSS aggiuntive |

---

### CrudTableRow

Wrapper per righe tabella con animazione Framer Motion.

```tsx
import { CrudTableRow } from "@/components/crud";

{filteredItems.map((city, index) => (
  <CrudTableRow key={city.id} index={index}>
    <TableCell>{city.name}</TableCell>
    <TableCell>{city.province}</TableCell>
    <TableCell>
      <CrudTableActions ... />
    </TableCell>
  </CrudTableRow>
))}
```

**Props:**
| Prop | Tipo | Obbligatorio | Descrizione |
|------|------|--------------|-------------|
| `index` | `number` | ✅ | Indice per calcolo delay animazione |
| `children` | `ReactNode` | ✅ | Celle della riga |
| `className` | `string` | ❌ | Classi CSS aggiuntive |

---

### CrudTableActions

Bottoni Edit/Delete standardizzati per celle azioni.

```tsx
import { CrudTableActions } from "@/components/crud";

<CrudTableActions
  onEdit={() => handleOpenDialog(city)}
  onDelete={() => {
    setSelectedItem(city);
    setDeleteDialogOpen(true);
  }}
  showEdit={true}    // default: true
  showDelete={true}  // default: true
/>
```

**Props:**
| Prop | Tipo | Obbligatorio | Default | Descrizione |
|------|------|--------------|---------|-------------|
| `onEdit` | `() => void` | ❌ | - | Handler click Edit |
| `onDelete` | `() => void` | ❌ | - | Handler click Delete |
| `showEdit` | `boolean` | ❌ | `true` | Mostra bottone Edit |
| `showDelete` | `boolean` | ❌ | `true` | Mostra bottone Delete |
| `size` | `"sm" \| "default"` | ❌ | `"sm"` | Dimensione bottoni |
| `className` | `string` | ❌ | - | Classi CSS aggiuntive |

---

### DeleteConfirmDialog

Dialog di conferma eliminazione universale.

```tsx
import { DeleteConfirmDialog } from "@/components/crud";

<DeleteConfirmDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onConfirm={handleDelete}
  entityName="città"
  entityLabel={selectedItem?.name}
  isLoading={saving}
/>
```

**Props:**
| Prop | Tipo | Obbligatorio | Default | Descrizione |
|------|------|--------------|---------|-------------|
| `open` | `boolean` | ✅ | - | Stato apertura dialog |
| `onOpenChange` | `(open: boolean) => void` | ✅ | - | Handler cambio stato |
| `onConfirm` | `() => void` | ✅ | - | Handler conferma eliminazione |
| `entityName` | `string` | ❌ | `"elemento"` | Nome tipo entità (es. "città") |
| `entityLabel` | `string` | ❌ | - | Nome specifico (es. "Milano") |
| `title` | `string` | ❌ | Auto-generato | Titolo dialog |
| `description` | `string` | ❌ | Auto-generato | Descrizione dialog |
| `confirmLabel` | `string` | ❌ | `"Elimina"` | Testo bottone conferma |
| `cancelLabel` | `string` | ❌ | `"Annulla"` | Testo bottone annulla |
| `isLoading` | `boolean` | ❌ | `false` | Stato caricamento |

---

### TableLoadingRow & TableEmptyRow

Stati loading e empty specifici per tabelle.

```tsx
import { TableLoadingRow, TableEmptyRow } from "@/components/crud";

<TableBody>
  {loading ? (
    <TableLoadingRow colSpan={4} message="Caricamento..." />
  ) : filteredItems.length === 0 ? (
    <TableEmptyRow
      colSpan={4}
      icon={MapPin}
      message="Nessuna città trovata"
    />
  ) : (
    filteredItems.map(...)
  )}
</TableBody>
```

**TableLoadingRow Props:**
| Prop | Tipo | Obbligatorio | Default | Descrizione |
|------|------|--------------|---------|-------------|
| `colSpan` | `number` | ✅ | - | Numero colonne tabella |
| `message` | `string` | ❌ | `"Caricamento..."` | Messaggio loading |

**TableEmptyRow Props:**
| Prop | Tipo | Obbligatorio | Default | Descrizione |
|------|------|--------------|---------|-------------|
| `colSpan` | `number` | ✅ | - | Numero colonne tabella |
| `icon` | `LucideIcon` | ❌ | - | Icona Lucide |
| `message` | `string` | ❌ | `"Nessun elemento trovato"` | Messaggio empty |
| `description` | `string` | ❌ | - | Descrizione aggiuntiva |

---

### CrudSearchBar

Barra ricerca standalone con icona.

```tsx
import { CrudSearchBar } from "@/components/crud";

<CrudSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Cerca..."
  className="max-w-sm"
/>
```

---

### Esempio Completo: CitiesPage

```tsx
import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { PageHeader } from "@/components/common/PageHeader";
import {
  CrudTableCard,
  CrudTableActions,
  CrudTableRow,
  TableEmptyRow,
  TableLoadingRow,
  DeleteConfirmDialog,
} from "@/components/crud";
import { useCrudState } from "@/hooks/useCrudState";

interface City {
  id: string;
  name: string;
  province: string | null;
  region: string | null;
  created_at: string;
}

export default function CitiesPage() {
  const {
    items: cities,
    loading,
    searchTerm,
    setSearchTerm,
    selectedItem,
    setSelectedItem,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    saving,
    handleSave,
    handleDelete,
    filteredItems,
  } = useCrudState<City>({
    tableName: "cities",
    orderBy: { column: "name", ascending: true },
    searchFields: ["name", "province", "region"],
  });

  const [formData, setFormData] = useState({ name: "", province: "", region: "" });

  const handleOpenDialog = (city?: City) => {
    if (city) {
      setSelectedItem(city);
      setFormData({ name: city.name, province: city.province || "", region: city.region || "" });
    } else {
      setSelectedItem(null);
      setFormData({ name: "", province: "", region: "" });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    await handleSave({
      name: formData.name.trim(),
      province: formData.province.trim() || null,
      region: formData.region.trim() || null,
    });
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Città"
          description="Gestisci le città dove operiamo"
          actions={
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuova Città
            </Button>
          }
        />

        <CrudTableCard
          title={`${cities.length} Città`}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Cerca città..."
        >
          <Table>
            <TableHeader>
              <tr className="bg-muted/50">
                <TableHead>Città</TableHead>
                <TableHead>Provincia</TableHead>
                <TableHead>Regione</TableHead>
                <TableHead className="w-24">Azioni</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingRow colSpan={4} />
              ) : filteredItems.length === 0 ? (
                <TableEmptyRow colSpan={4} icon={MapPin} message="Nessuna città trovata" />
              ) : (
                filteredItems.map((city, index) => (
                  <CrudTableRow key={city.id} index={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{city.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{city.province || "—"}</TableCell>
                    <TableCell>{city.region || "—"}</TableCell>
                    <TableCell>
                      <CrudTableActions
                        onEdit={() => handleOpenDialog(city)}
                        onDelete={() => {
                          setSelectedItem(city);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    </TableCell>
                  </CrudTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CrudTableCard>
      </div>

      {/* Dialog form - resta custom per massima flessibilità */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Modifica Città" : "Nuova Città"}</DialogTitle>
          </DialogHeader>
          {/* Form fields... */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        entityName="città"
        entityLabel={selectedItem?.name}
        isLoading={saving}
      />
    </SuperAdminLayout>
  );
}
```

---

### Pagine Refactorate con CRUD Pattern

| Pagina | Hook | Componenti UI | Note |
|--------|------|---------------|------|
| `CitiesPage` | ✅ `useCrudState` | ✅ Tutti | Refactoring completo |
| `CategoriesPage` | ✅ `useCrudState` | ✅ Tutti | Refactoring completo |
| `CompaniesPage` | ❌ Custom | ✅ UI only | Logica custom per logo upload |
| `AssociationsPage` | ❌ Custom | ✅ UI only | Logica custom per multi-città |
| `UsersPage` | ❌ Custom | ✅ UI only | Logica custom per ruoli/tenant |
| `AccessCodesPage` | ❌ Custom | ❌ Nessuno | Troppo custom |

---

## 🔄 Quando Usare i Componenti Riutilizzabili

| Situazione | Componente da usare |
|------------|---------------------|
| Header di una pagina admin | `PageHeader` |
| Visualizzare KPI/metriche | `MetricCard` |
| Stato di caricamento dati | `LoadingState` |
| Lista/tabella vuota | `EmptyState` |
| Form modifica profilo | `ProfileEditForm` |
| Pagina CRUD semplice | `useCrudState` + componenti CRUD |
| Pagina CRUD complessa | Solo componenti UI CRUD |

**Vantaggi:**
- ✅ Consistenza visiva garantita
- ✅ Animazioni e stili pre-configurati
- ✅ Responsive out-of-the-box
- ✅ Meno codice duplicato
- ✅ Manutenzione centralizzata

---

## ⚙️ Settings Pages Pattern

Le pagine impostazioni usano componenti riutilizzabili per garantire coerenza visiva.

### Componenti

| Componente | File | Uso |
|-----------|------|-----|
| `SettingsPage` | `src/components/common/SettingsPage.tsx` | Wrapper pagina: h2 + descrizione + animazione framer-motion |
| `SettingsSection` | `src/components/common/SettingsSection.tsx` | Sezione: h3 + descrizione opzionale + children + Separator |
| `AvatarUploadBlock` | `src/components/common/AvatarUploadBlock.tsx` | Avatar 64px + titolo + descrizione + bottone upload |
| `SettingsToggleRow` | `src/components/common/SettingsToggleRow.tsx` | Label a sinistra + Switch a destra |

### Struttura tipo

```tsx
<SettingsPage title="Titolo" description="Descrizione">
  <AvatarUploadBlock ... />
  <SettingsSection title="Sezione 1">
    {/* contenuto */}
  </SettingsSection>
  <SettingsSection title="Sezione 2" separator={false}>
    {/* ultima sezione senza separator */}
  </SettingsSection>
</SettingsPage>
```

### Regole spacing

- `mb-6` dopo header pagina (gestito da `SettingsPage`)
- `my-6` separator tra sezioni (gestito da `SettingsSection`)
- `mb-8` dopo `AvatarUploadBlock`
- Campi form: `space-y-4`, label `text-xs text-muted-foreground`
- Grid 2 colonne per nome/cognome: `grid grid-cols-1 sm:grid-cols-2 gap-4`

---

## 📚 Riferimenti

- **Tailwind Config**: `tailwind.config.ts`
- **CSS Variables**: `src/index.css`
- **UI Components (shadcn)**: `src/components/ui/`
- **Componenti Riutilizzabili**: `src/components/common/`, `src/components/profile/`
- **Componenti CRUD**: `src/components/crud/`
- **Componenti Settings**: `src/components/common/Settings*.tsx`
- **Hook CRUD**: `src/hooks/useCrudState.ts`
- **Layout Admin**: `src/components/layout/AdminLayout.tsx`

- **Tailwind Config**: `tailwind.config.ts`
- **CSS Variables**: `src/index.css`
- **UI Components (shadcn)**: `src/components/ui/`
- **Componenti Riutilizzabili**: `src/components/common/`, `src/components/profile/`
- **Componenti CRUD**: `src/components/crud/`
- **Hook CRUD**: `src/hooks/useCrudState.ts`
- **Layout Admin**: `src/components/layout/AdminLayout.tsx`
