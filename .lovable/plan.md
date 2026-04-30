# Dark theme refinement — Attio-inspired

## What Attio does well (from the screenshot)
- **Cool, blue-tinted neutrals**, not pure gray. Background sits around `hsl(222 18% 8%)`, surfaces step up by ~2% lightness only.
- **Three-tier surface system** with very small contrast jumps: app background → sidebar/card → hover/elevated. The eye reads it as one calm canvas.
- **Hairline borders** at very low contrast (~14% lightness on cool hue) — they delimit table cells and panels without ever shouting.
- **Muted foreground** is high enough to stay readable (~62% lightness) but the *primary* foreground is not pure white — closer to `hsl(220 14% 92%)` to reduce glare.
- **Saturated color is reserved**: only the brand purple (active sidebar item, primary CTA) and tag chips (green/blue/orange/red pill backgrounds at low saturation + bright text). Body chrome stays achromatic.
- **Tag chips** = ~12–15% lightness colored background + ~70% lightness same-hue text. Never fully saturated.

## What our current dark theme gets wrong
- Neutrals are pure gray (`0 0% 8%`) → looks flat and "cheap dark", missing Attio's depth.
- `--secondary` and `--accent` are bright magenta/pink (`290 67% 55%`, `330 56% 60%`) — these are brand colors, not neutral surfaces. Anywhere shadcn uses `bg-secondary` or `bg-accent` for hover/buttons becomes garish.
- `--muted` (`0 0% 15%`) is barely distinguishable from `--background` (`0 0% 8%`) and from `--card` (`0 0% 10%`) — the layering tier is wasted.
- `--border` at `0 0% 18%` is too visible; Attio's hairlines are ~10–14%.
- `--foreground` at `0 0% 95%` is too white → glare.

## Proposed token overhaul (`src/index.css`, `.dark` block only)

Cool hue base: `220` (subtle blue) at very low saturation `14%`.

```css
.dark {
  /* Layered surfaces — small steps, cool tint */
  --background: 220 14% 8%;        /* app canvas */
  --foreground: 220 14% 92%;       /* primary text, off-white */

  --card: 220 14% 10%;             /* panels, cards */
  --card-foreground: 220 14% 92%;

  --popover: 220 14% 12%;          /* menus, dropdowns float higher */
  --popover-foreground: 220 14% 94%;

  /* Brand — slightly desaturated for dark bg comfort */
  --primary: 274 70% 62%;
  --primary-foreground: 0 0% 100%;

  /* Neutral hover/secondary surfaces (NOT brand colors) */
  --secondary: 220 14% 14%;
  --secondary-foreground: 220 14% 90%;

  --accent: 220 14% 16%;           /* hover, selected row */
  --accent-foreground: 220 14% 96%;

  --muted: 220 14% 13%;
  --muted-foreground: 220 9% 62%;  /* meta text like "about 17 hours ago" */

  --destructive: 0 70% 55%;
  --destructive-foreground: 0 0% 100%;

  --success: 142 55% 50%;
  --success-foreground: 0 0% 100%;
  --warning: 38 85% 58%;
  --warning-foreground: 0 0% 10%;

  /* Hairlines — barely there */
  --border: 220 13% 16%;
  --input: 220 13% 18%;
  --ring: 274 70% 62%;

  /* Sidebar — same family, slightly darker than canvas (Attio pattern) */
  --sidebar-background: 220 16% 7%;
  --sidebar-foreground: 220 12% 78%;
  --sidebar-primary: 274 70% 62%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 220 14% 13%;          /* hover */
  --sidebar-accent-foreground: 220 14% 96%;
  --sidebar-border: 220 13% 14%;
  --sidebar-ring: 274 70% 62%;

  /* Brand accents — keep punch where they belong (CTAs, gradients, tags) */
  --bravo-purple: 274 80% 65%;
  --bravo-magenta: 290 60% 60%;
  --bravo-pink: 330 55% 65%;
  --bravo-orange: 26 90% 68%;
  --bravo-yellow: 45 90% 65%;

  --gradient-hero: linear-gradient(135deg, hsl(274 80% 60%) 0%, hsl(330 55% 60%) 50%, hsl(26 90% 65%) 100%);
  --gradient-card: linear-gradient(180deg, hsl(220 14% 10%) 0%, hsl(220 14% 11%) 100%);
}
```

Plus: bump the admin-panel scoped override to match the new primary lightness.

```css
.dark .admin-panel {
  --primary: 274 65% 65%;
  --foreground: 220 14% 92%;
}
```

## Why these specific values
- **Hue 220 / sat 14%** mimics Attio's cool slate. Pure neutral (`0 0% x%`) reads as cheap; a touch of blue reads as software-grade.
- **8 → 10 → 12 → 14 → 16% lightness ladder** = five surface tiers within 8 percentage points. Enough separation to layer cards/popovers/hovers, never enough to feel patchy.
- **Foreground at 92%** instead of 95% reduces eye strain in long admin sessions (Attio uses a similar off-white).
- **Primary down from 100% → 70% saturation** because saturated violet on near-black vibrates; Attio desaturates accents in dark mode for the same reason.
- **Reclaiming `--secondary` and `--accent` as neutral surfaces** is the single biggest fix — every shadcn hover state currently turns magenta. After this change, default Button/Tabs/Toggle hovers become subtle gray, while explicit `bg-primary` CTAs keep their brand violet.

## Out of scope (deliberate)
- Light theme tokens — unchanged.
- Component-level changes — none. We only retune CSS variables; every component already consumes them.
- `--bravo-*` brand vars stay punchy because they're used in the marketing gradient hero, not in chrome.
- Tag/chip color recipes (green/blue/orange pills like in the screenshot) — those live in component code, not in tokens; if you want me to harmonize them too, that's a separate follow-up.

## Files touched
- edit `src/index.css` — only the `.dark` block (lines ~83–135) and the `.dark .admin-panel` block (lines ~78–81).

## How to verify after applying
1. Toggle theme to "Scuro" from `/hr/impostazioni/tema`.
2. Walk through: HR home, HR users table, Super Admin companies list, association catalog. Look for: subtle hairlines, no magenta hover surfaces, readable but not glaring text, sidebar slightly darker than canvas.
3. Check primary CTA buttons still pop (they should — primary is now 70% sat instead of 100%, which on near-black feels *more* premium, not less).
