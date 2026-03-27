

# Piano: Consolidamento Design System e Componenti Riutilizzabili

## Problema

Le pagine dell'app hanno pattern visivi ripetuti ma implementati in modo leggermente diverso ogni volta: header delle sezioni settings, layout avatar+upload, sezioni con titolo+descrizione+separator. Questo causa inconsistenze e codice duplicato. Il `docs/design-system.md` esiste ed è dettagliato ma manca di pattern per le pagine settings e di componenti riutilizzabili per quei pattern.

## Strategia

Creare componenti riutilizzabili per i pattern più comuni e aggiornare il design system con le nuove convenzioni. Non tocchiamo le pagine consumer (già consolidate), ci concentriamo sulle aree admin/settings dove c'è più frammentazione.

## Modifiche

### 1. Nuovo componente `SettingsSection`

Pattern che si ripete in tutte le pagine settings: titolo h3, descrizione opzionale, contenuto, separator opzionale in fondo.

```tsx
// src/components/common/SettingsSection.tsx
<SettingsSection title="Budget ore" description="Descrizione opzionale">
  {children}
</SettingsSection>
```

Props: `title`, `description?`, `children`, `className?`. Gestisce `<h3>`, `<p>`, spacing e `<Separator>` automaticamente tra sezioni consecutive.

### 2. Nuovo componente `SettingsPage`

Wrapper per pagine settings con header consistente (h2 + descrizione + animazione).

```tsx
// src/components/common/SettingsPage.tsx
<SettingsPage title="Profilo personale" description="Gestisci le tue informazioni">
  <SettingsSection title="Avatar">...</SettingsSection>
  <SettingsSection title="Dati personali">...</SettingsSection>
</SettingsPage>
```

Gestisce: `motion.div` con animazione standard, `h2 text-lg font-semibold`, `p text-sm text-muted-foreground`, `space-y-0` tra sezioni (il separator è dentro SettingsSection).

### 3. Nuovo componente `AvatarUploadBlock`

Pattern ripetuto in SettingsProfile e SettingsGeneral: avatar + titolo + descrizione + bottone upload.

```tsx
// src/components/common/AvatarUploadBlock.tsx
<AvatarUploadBlock
  imageUrl={profile?.avatar_url}
  fallbackInitials="MR"
  title="Foto profilo"
  description="Supportiamo PNG e JPEG sotto 2MB"
  onUpload={handleUpload}
  uploading={uploading}
/>
```

### 4. Nuovo componente `SettingsToggleRow`

Pattern ripetuto in SettingsVolunteering: label a sinistra, Switch a destra.

```tsx
// src/components/common/SettingsToggleRow.tsx
<SettingsToggleRow
  label="I dipendenti possono prenotarsi in autonomia"
  checked={value}
  onCheckedChange={setValue}
/>
```

### 5. Refactor pagine settings esistenti

Riscrivere le 5 pagine settings per usare i nuovi componenti. Nessun cambio funzionale, solo composizione con i nuovi building blocks.

### 6. Aggiornamento `docs/design-system.md`

Aggiungere sezione "Settings Pages" con:
- Pattern `SettingsPage` + `SettingsSection`
- Pattern `AvatarUploadBlock`
- Pattern `SettingsToggleRow`
- Regole spacing (separator `my-6` tra sezioni, `mb-6` dopo header pagina)

## File coinvolti

| File | Modifica |
|------|----------|
| `src/components/common/SettingsSection.tsx` | Nuovo |
| `src/components/common/SettingsPage.tsx` | Nuovo |
| `src/components/common/AvatarUploadBlock.tsx` | Nuovo |
| `src/components/common/SettingsToggleRow.tsx` | Nuovo |
| `src/pages/hr/settings/SettingsProfile.tsx` | Refactor con nuovi componenti |
| `src/pages/hr/settings/SettingsGeneral.tsx` | Refactor con nuovi componenti |
| `src/pages/hr/settings/SettingsMembers.tsx` | Refactor con nuovi componenti |
| `src/pages/hr/settings/SettingsVolunteering.tsx` | Refactor con nuovi componenti |
| `docs/design-system.md` | Aggiunta sezione Settings Pages |

Nessuna modifica a database o RLS.

