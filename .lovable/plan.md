# PROMPT 3 — Fix selettore tema

## Approccio scelto
Implementare il dark mode realmente. Le CSS variables `.dark` esistono già in `src/index.css` (righe 83–135) e Tailwind è configurato `darkMode: ["class"]`. Manca solo lo strato JS che applica la classe `dark` su `<html>` e un hook condiviso che sostituisca `next-themes` (importato da `sonner.tsx` ma non installato/configurato).

Scope: il toggle si applica a tutta l'app (Tailwind usa la classe sulla root). Nessuna pagina ha override forzati al light, quindi anche le pagine employee rispetteranno la scelta. Default = `system` (preserva il comportamento attuale per chi non ha mai cambiato).

## Modifiche

### 1. Nuovo hook + provider — `src/hooks/useTheme.tsx`
- Tipo `Theme = "light" | "dark" | "system"`.
- Context con `{ theme, setTheme, resolvedTheme }`.
- `ThemeProvider`:
  - Legge `localStorage.getItem("bravo-theme")` all'avvio (fallback `"system"`).
  - Funzione `applyTheme(theme)` che calcola il tema risolto (se `system`, usa `window.matchMedia('(prefers-color-scheme: dark)').matches`) e fa `document.documentElement.classList.toggle("dark", isDark)`.
  - `useEffect` per applicare al mount e ad ogni cambio di `theme`.
  - `useEffect` separato che, solo quando `theme === "system"`, registra un listener su `matchMedia('(prefers-color-scheme: dark)')` per riapplicare al cambio OS.
  - `setTheme` aggiorna stato + scrive in `localStorage`.
- Hook `useTheme()` che throwa se usato fuori dal provider.

### 2. Montaggio provider — `src/App.tsx`
Avvolgere il contenuto dentro `QueryClientProvider` con `<ThemeProvider>` (subito sopra `<AuthProvider>`), così è disponibile ovunque incluso il Sonner Toaster.

### 3. Sostituire `next-themes` — `src/components/ui/sonner.tsx`
- Cambiare `import { useTheme } from "next-themes"` → `import { useTheme } from "@/hooks/useTheme"`.
- Adattare: `const { resolvedTheme = "light" } = useTheme();` e passarlo come `theme` a `<Sonner>` (usa "light" | "dark", non "system").

### 4. Wire-up del selettore — `src/pages/hr/settings/SettingsTheme.tsx`
- Rimuovere `useState` locale.
- Usare `const { theme, setTheme } = useTheme()`.
- `selected` ← `theme`; `onClick` ← `setTheme(opt.id)`.
- Nessuna modifica visiva.

### 5. Anti-flash all'avvio — `index.html`
Inserire prima di `<script type="module" src="/src/main.tsx">` uno script inline minimale che legge `localStorage["bravo-theme"]` e aggiunge subito la classe `dark` su `<html>` se necessario, evitando il flash bianco al refresh in dark mode.

```html
<script>
  (function(){
    try {
      var t = localStorage.getItem('bravo-theme') || 'system';
      var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) document.documentElement.classList.add('dark');
    } catch(e){}
  })();
</script>
```

## File toccati
- create `src/hooks/useTheme.tsx`
- edit `src/App.tsx` (montaggio provider)
- edit `src/components/ui/sonner.tsx` (rimuove dipendenza next-themes)
- edit `src/pages/hr/settings/SettingsTheme.tsx` (collega all'hook)
- edit `index.html` (anti-flash)

## Fuori scope (volutamente)
- Nessuna modifica alle CSS variables (già presenti).
- Nessun salvataggio del tema su DB/profilo utente — solo `localStorage` per ora (coerente con la scelta dei prompt precedenti di non toccare lo schema DB).
- Nessuna esposizione del selettore nei pannelli impostazioni di Super Admin / Association Admin in questo prompt — se vorrai duplicarlo lì, lo facciamo in un prompt successivo.
