

# Piano: Design system — Scoped admin styling

## 1. Variabili globali in `index.css` (:root)

Modificare due variabili in `:root`:
- `--radius`: da `0.75rem` a `0.5rem`
- `--border`: da `0 0% 81%` a `0 0% 88%`

## 2. Blocco `.admin-panel` in `index.css`

Aggiungere dopo il blocco `:root`:

```css
.admin-panel {
  --primary: 274 80% 55%;
  --foreground: 0 0% 15%;
}
```

Dentro `@layer components`, aggiungere override per bottoni admin compatti:

```css
.admin-panel .inline-flex[class*="h-10"] { /* button default size override */ }
```

Approccio piu' pragmatico: dato che il CSS selector per i bottoni e' complesso, la strategia migliore e' sovrascrivere via CSS le dimensioni del bottone default dentro `.admin-panel` usando il selector per i bottoni shadcn (che hanno tutti la classe base del `buttonVariants`). In alternativa, aggiungere regole specifiche:

```css
.admin-panel button:not([data-size]) {
  /* reduce to ~h-8 equivalent */
}
```

In pratica il modo piu' pulito: aggiungere in `.admin-panel` una regola che riduce `h-10` a `h-8` e il padding dei bottoni. Usiamo un approccio semplice con utility classes nel CSS.

## 3. Attivare `.admin-panel` in `AdminLayout.tsx`

Aggiungere `admin-panel` al div root (riga 97):
```tsx
<div className="min-h-screen bg-background admin-panel">
```

## 4. Cleanup glassmorphism in `AdminLayout.tsx`

- Sidebar: `bg-card/95 backdrop-blur-md` → `bg-card`, `border-border/50` → `border-border`
- Mobile overlay: `bg-background/80 backdrop-blur-sm` → `bg-black/50` (overlay standard)
- Mobile header: `border-border/50 bg-background/80 backdrop-blur-md` → `border-border bg-background`

## 5. Cleanup glassmorphism nelle pagine admin

Tutti i file con `bg-card/80 backdrop-blur-sm` e `border-border/50`:

| File | Occorrenze |
|------|-----------|
| `src/pages/super-admin/UsersPage.tsx` | 1 |
| `src/pages/super-admin/AccessCodesPage.tsx` | 1 |
| `src/pages/super-admin/SuperAdminDashboard.tsx` | 1 |
| `src/pages/super-admin/SuperAdminProfile.tsx` | 3 + 1 cardClassName |
| `src/pages/super-admin/ExperiencesPage.tsx` | 1 |
| `src/pages/hr/HRProfile.tsx` | 3 + 1 cardClassName |
| `src/pages/hr/HRExperiencesPage.tsx` | 2 |
| `src/pages/hr/HREmployeesPage.tsx` | 2 |
| `src/pages/association/AssociationAdminProfile.tsx` | 3 + 1 cardClassName |
| `src/pages/association/AssociationHome.tsx` | 2+ |

Sostituzione: `border-border/50 bg-card/80 backdrop-blur-sm` → `border bg-card`

## 6. Icone colorate nella sidebar

Estendere `SidebarItem` con campo opzionale `iconColor?: string` (classe Tailwind, es. `"text-blue-500"`).

In `AdminLayout.tsx`, quando la voce e' attiva e ha `iconColor`, applicare quel colore all'icona. Quando inattiva, l'icona resta `text-muted-foreground` come oggi.

```tsx
<Icon className={cn("h-4 w-4", active && item.iconColor ? item.iconColor : "")} />
```

Aggiungere `iconColor` alle voci in `AssociationLayout.tsx`:
- Profilo Pubblico: `text-blue-500`
- Home: `text-violet-500`
- Volontariato aziendale: `text-green-500`
- Calendario: `text-orange-500`
- Report: `text-rose-500`

HR e SuperAdmin non specificano `iconColor` → comportamento invariato.

## 7. Bottoni compatti admin

Approccio CSS in `index.css` dentro `.admin-panel`:

```css
.admin-panel button {
  /* Override default size to sm equivalent */
}
```

Piu' specificatamente, il modo piu' affidabile: aggiungere una regola CSS che targetta i bottoni con altezza h-10 (default) dentro `.admin-panel` e li riduce a h-8 con padding ridotto. Usiamo:

```css
@layer components {
  .admin-panel :where(button, [role="button"]):not([data-no-compact]) {
    --btn-h: 2rem; /* h-8 = 32px */
    min-height: var(--btn-h);
    font-size: 0.8125rem; /* 13px */
  }
}
```

## File coinvolti

| File | Azione |
|------|--------|
| `src/index.css` | Variabili globali + blocco `.admin-panel` + bottoni compatti |
| `src/components/layout/AdminLayout.tsx` | Classe `admin-panel` + cleanup glassmorphism + iconColor |
| `src/components/layout/AssociationLayout.tsx` | Aggiungere `iconColor` alle voci |
| 10 pagine admin (vedi tabella sopra) | Cleanup glassmorphism |

Nessuna modifica a pagine consumer, database o RLS.

