## Diagnosi

Le pagine HR top-level (Calendario, Volontariato aziendale, Utenti, Galleria, ETS Suggeriti, Team building sociali) usano già `PageHeader` con icona colorata e senza descrizione — sono a posto.

Da sistemare:
- **Pagina Report** (`/hr/report`): ha già l'icona ma mostra ancora il sottotitolo.
- **Pagine `/hr/impostazioni/*`**: usano `SettingsPage` (o markup custom in Tema) con titolo + sottotitolo e **senza** icona di fianco al titolo.

## 1. Pagina Report — `src/pages/HRDashboard.tsx`

Rimuovere la prop `description="L'impatto del volontariato della tua azienda"` dal `PageHeader` (righe 102-107). Titolo "Report", icona `BarChart3` `text-rose-500` restano invariati. Le `description` interne delle sezioni Coinvolgimento/Impatto/Aree/Soddisfazione restano.

## 2. Componente `src/components/common/SettingsPage.tsx`

Estendere l'API:
- `description` diventa **opzionale**.
- Aggiungere prop opzionali `icon?: LucideIcon` e `iconColor?: string`.
- Header riallineato a `PageHeader` (icona 5×5 a sinistra, titolo a destra), descrizione renderizzata solo se passata.

Nessuna modifica al resto (animazioni, children, className).

## 3. Pagine impostazioni HR — rimuovere description e aggiungere icona

Icone/colori coerenti con la sidebar di `HRSettingsLayout`:

1. `src/pages/hr/settings/SettingsProfile.tsx` → `icon={User}` `iconColor="text-violet-500"`, rimuovere `description`.
2. `src/pages/hr/settings/SettingsGeneral.tsx` → `icon={Building2}` `iconColor="text-blue-500"`, rimuovere `description`.
3. `src/pages/hr/settings/SettingsMembers.tsx` → `icon={Users}` `iconColor="text-green-500"`, rimuovere `description`.
4. `src/pages/hr/settings/SettingsVolunteering.tsx` → `icon={Heart}` `iconColor="text-green-500"`, rimuovere `description`.
5. `src/pages/hr/settings/SettingsTheme.tsx` → oggi usa markup custom con `h2` + `p`. Riscrivere usando `SettingsPage` con `title="Tema"`, `icon={Palette}`, `iconColor="text-amber-500"`, nessuna description. Contenuto (le 3 card chiaro/scuro/sistema) invariato.
6. `src/components/settings/SecuritySettingsContent.tsx` (usato dalla route HR `/hr/impostazioni/sicurezza`, condiviso anche con association/super-admin): aggiungere `icon={Shield}` `iconColor="text-emerald-500"` e rimuovere `description`. L'icona Shield è semanticamente corretta per tutte le aree admin che riusano il componente.

## Cosa NON tocchiamo

- Le altre pagine HR top-level (già OK).
- `SettingsDisabled.tsx` (placeholder senza titolo).
- Routing, sidebar, layout, logica delle pagine.
- Le `description` delle sotto-sezioni interne (`SettingsSection`, `PageSection`): la richiesta riguarda solo il sottotitolo "in alto" della pagina.
