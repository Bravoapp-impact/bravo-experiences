# Piano: Ristrutturazione Impostazioni HR (stile Attio)

## Panoramica

Trasformare la pagina Impostazioni in un layout fullscreen con sidebar dedicata (come Attio), sotto-route per ogni sezione, responsive, e Switch più compatti.

## Modifiche

### 1. Layout fullscreen con sidebar propria

La pagina Impostazioni NON usa `HRLayout`. Diventa un layout autonomo fullscreen:

- Sidebar sinistra con freccia "indietro" in alto (torna a `/hr`)
- Gruppi di navigazione come ora ma con `<NavLink>` a sotto-route
- Su mobile: sidebar nascosta, header con hamburger o select dropdown

### 2. Sotto-route per ogni sezione

`App.tsx`: sostituire la route singola `/hr/impostazioni` con una route parent + nested routes:

- `/hr/impostazioni` → redirect a `/hr/impostazioni/profilo`
- `/hr/impostazioni/profilo`
- `/hr/impostazioni/tema`
- `/hr/impostazioni/generali`
- `/hr/impostazioni/membri`
- `/hr/impostazioni/volontariato`
- Sezioni disabilitate: nessuna route, link non cliccabili

### 3. Ristrutturazione file

Creare un layout wrapper `HRSettingsLayout.tsx` con:

- Sidebar sinistra (w-56, border-r, full height)
- Header sidebar: freccia indietro + "Impostazioni"
- Gruppi navigazione con `useLocation` per evidenziare la sezione attiva
- Su mobile: sidebar collassabile o sheet
- Area contenuto a destra con scroll, padding e max-width

Spezzare `HRSettingsPage.tsx` in file sezione separati sotto `src/pages/hr/settings/`:

- `SettingsProfile.tsx`
- `SettingsTheme.tsx`
- `SettingsGeneral.tsx`
- `SettingsMembers.tsx`
- `SettingsVolunteering.tsx`
- `SettingsDisabled.tsx` (placeholder per sezioni future)

### 4. Switch compatto (stile Attio)

Lo screenshot Attio mostra toggle piccoli e sottili. Ridurre dimensioni del Switch:

- Root: `h-4 w-7` (da `h-6 w-11`)
- Thumb: `h-3 w-3`, `translate-x-3` quando checked (da `h-5 w-5`, `translate-x-5`)
- Colore checked: mantenere `bg-primary`

Modifica anche il switch globale secondo queste specifiche di design - ogni switch nella web app deve avere queste caratteristiche -> creiamo un componente o se già creato lo modifichiamo

### 5. Profilo e Generali editabili

Le sezioni Profilo e Generali mantengono la funzionalità di editing che era presente prima (nome, cognome, avatar upload). Si riutilizza il pattern `ProfileEditForm` esistente dove possibile.

### 6. Responsive

- Desktop: due colonne (sidebar 224px + contenuto)
- Tablet (< md): sidebar nascosta, sheet laterale con trigger hamburger nell'header
- Mobile: stessa logica tablet, contenuto full-width con padding ridotto

## File coinvolti


| File                                             | Modifica                                |
| ------------------------------------------------ | --------------------------------------- |
| `src/components/layout/HRSettingsLayout.tsx`     | Nuovo - layout fullscreen con sidebar   |
| `src/pages/hr/settings/SettingsProfile.tsx`      | Nuovo                                   |
| `src/pages/hr/settings/SettingsTheme.tsx`        | Nuovo                                   |
| `src/pages/hr/settings/SettingsGeneral.tsx`      | Nuovo                                   |
| `src/pages/hr/settings/SettingsMembers.tsx`      | Nuovo                                   |
| `src/pages/hr/settings/SettingsVolunteering.tsx` | Nuovo                                   |
| `src/pages/hr/settings/SettingsDisabled.tsx`     | Nuovo                                   |
| `src/pages/hr/HRSettingsPage.tsx`                | Eliminato o svuotato (logica spostata)  |
| `src/App.tsx`                                    | Route nested sotto `/hr/impostazioni/*` |


Nessuna modifica a database o RLS.